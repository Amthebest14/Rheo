// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IStrategy} from "./interfaces/IStrategy.sol";

/**
 * @title RheoVault
 * @author Rheo Finance
 * @notice An ERC-4626 compliant yield-aggregating vault contract for Hedera network.
 * It accepts an underlying asset (e.g. SaucerSwap LP token) and delegates management
 * of those assets to a strategy contract to earn compound interest.
 */
contract RheoVault is ERC4626, Ownable {
    using SafeERC20 for IERC20;

    IStrategy public strategy;
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public performanceFee = 500; // Default: 5.00% fee on yield rewards

    event StrategyUpdated(address indexed newStrategy);
    event PerformanceFeeUpdated(uint256 newFee);

    error StrategyRequired();
    error InvalidFee();

    constructor(
        IERC20 _asset,
        string memory _name,
        string memory _symbol,
        address _initialOwner
    ) ERC4626(_asset) ERC20(_name, _symbol) Ownable(_initialOwner) {}

    /**
     * @notice Set the yield aggregation strategy contract.
     * @param _strategy Address of the strategy contract conforming to IStrategy.
     */
    function setStrategy(IStrategy _strategy) external onlyOwner {
        if (address(_strategy) == address(0)) revert StrategyRequired();
        strategy = _strategy;
        emit StrategyUpdated(address(_strategy));
    }

    /**
     * @notice Set the performance fee in basis points (e.g. 500 = 5.00%).
     * @param _fee Fee value in basis points.
     */
    function setPerformanceFee(uint256 _fee) external onlyOwner {
        if (_fee > 2000) revert InvalidFee(); // Cap fee at 20%
        performanceFee = _fee;
        emit PerformanceFeeUpdated(_fee);
    }

    /**
     * @dev Overrides totalAssets to account for both the liquid assets in the Vault
     * and the assets managed/staked by the Strategy contract.
     */
    function totalAssets() public view virtual override returns (uint256) {
        uint256 vaultBalance = IERC20(asset()).balanceOf(address(this));
        uint256 strategyBalance = address(strategy) != address(0) ? strategy.totalManagedAssets() : 0;
        return vaultBalance + strategyBalance;
    }

    /**
     * @dev Hook called after deposits are made to automatically transfer and invest
     * underlying assets into the strategy.
     */
    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal virtual override {
        super._deposit(caller, receiver, assets, shares);
        if (address(strategy) != address(0)) {
            IERC20(asset()).safeTransfer(address(strategy), assets);
            strategy.invest();
        }
    }

    /**
     * @dev Hook called during withdrawals to fetch assets back from the strategy
     * if the vault's liquid balance is not enough to cover the withdrawal.
     */
    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares
    ) internal virtual override {
        if (caller != owner) {
            _spendAllowance(owner, caller, shares);
        }

        // Burn the shares first
        _burn(owner, shares);

        // Fetch assets from strategy if vault balance is insufficient
        uint256 vaultBalance = IERC20(asset()).balanceOf(address(this));
        if (vaultBalance < assets) {
            uint256 amountToWithdraw = assets - vaultBalance;
            if (address(strategy) != address(0)) {
                strategy.withdrawToVault(amountToWithdraw);
            }
        }

        // Transfer the asset out to the receiver
        IERC20(asset()).safeTransfer(receiver, assets);

        emit Withdraw(caller, receiver, owner, assets, shares);
    }
}
