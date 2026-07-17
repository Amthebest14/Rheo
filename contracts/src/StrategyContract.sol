// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IStrategy} from "./interfaces/IStrategy.sol";
import {ISaucerSwapV1Router} from "./interfaces/ISaucerSwapV1Router.sol";
import {ISaucerSwapYieldFarm} from "./interfaces/ISaucerSwapYieldFarm.sol";
import {IExchangeRate} from "./interfaces/IExchangeRate.sol";

/**
 * @title StrategyContract
 * @author Rheo Finance
 * @notice The Strategy contract that stakes LP tokens, harvests SAUCE rewards,
 * swaps them 50/50 for underlying pool tokens, and recompounds them back into LP.
 */
contract StrategyContract is IStrategy, Ownable {
    using SafeERC20 for IERC20;

    address public override vault;
    IERC20 public override asset; // This is the LP token

    IERC20 public tokenA;
    IERC20 public tokenB;
    IERC20 public rewardToken; // SAUCE

    ISaucerSwapV1Router public router;
    ISaucerSwapYieldFarm public farm;
    uint256 public poolId;

    // Track assets currently staked in the SaucerSwap Yield Farm
    uint256 public stakedBalance;

    event Invested(uint256 amount);
    event Withdrawn(uint256 amount);
    event Harvested(uint256 rewardsCompounded, uint256 newLPMinted);

    modifier onlyVault() {
        require(msg.sender == vault, "Caller is not the vault");
        _;
    }

    constructor(
        address _vault,
        IERC20 _asset,
        IERC20 _tokenA,
        IERC20 _tokenB,
        IERC20 _rewardToken,
        ISaucerSwapV1Router _router,
        ISaucerSwapYieldFarm _farm,
        uint256 _poolId,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_vault != address(0), "Invalid vault address");
        vault = _vault;
        asset = _asset;
        tokenA = _tokenA;
        tokenB = _tokenB;
        rewardToken = _rewardToken;
        router = _router;
        farm = _farm;
        poolId = _poolId;
    }

    /**
     * @notice Receives LP tokens from the vault.
     * @dev Staking is delayed until harvest() to preserve fee-free deposits for users.
     */
    function invest() external override onlyVault {
        uint256 lpBalance = asset.balanceOf(address(this));
        if (lpBalance > 0) {
            emit Invested(lpBalance);
        }
    }

    /**
     * @notice Unstakes LP tokens and sends them back to the vault.
     * @dev Called automatically by the vault on withdrawals.
     * @param amount The amount of LP assets to withdraw.
     */
    function withdrawToVault(uint256 amount) external override onlyVault {
        require(amount <= stakedBalance + asset.balanceOf(address(this)), "Insufficient strategy assets");
        
        uint256 liquidBalance = asset.balanceOf(address(this));
        if (amount > liquidBalance) {
            uint256 amountFromFarm = amount - liquidBalance;
            farm.withdraw(poolId, amountFromFarm);
            stakedBalance -= amountFromFarm;
        }
        
        asset.safeTransfer(vault, amount);
        emit Withdrawn(amount);
    }

    /**
     * @notice Core yield-compounding execution trigger.
     * @dev Called hourly by the off-chain keeper network.
     */
    function harvest() external payable override {
        // Query the deposit fee from the farm (in tinycents)
        uint256 feeTinycents = farm.depositFee();
        
        // Convert the fee to tinybars using the Exchange Rate System Contract at 0x168
        uint256 feeTinybars = IExchangeRate(0x0000000000000000000000000000000000000168).tinycentsToTinybars(feeTinycents);

        // 1. Claim reward tokens ($SAUCE) from the farm if we have assets staked
        if (stakedBalance > 0) {
            require(msg.value >= feeTinybars, "HBAR value sent is less than the SaucerSwap claim fee");
            farm.deposit{value: feeTinybars}(poolId, 0); // 0 deposit triggers reward payout in MasterChef
        }

        uint256 rewards = rewardToken.balanceOf(address(this));
        if (rewards > 0) {
            uint256 halfRewards = rewards / 2;
            uint256 otherHalfRewards = rewards - halfRewards;

            // Approve rewardToken to the router
            rewardToken.approve(address(router), rewards);

            // Path for Token A (SAUCE -> Token A)
            address[] memory pathA = new address[](2);
            pathA[0] = address(rewardToken);
            pathA[1] = address(tokenA);

            // Path for Token B (SAUCE -> Token B)
            address[] memory pathB = new address[](2);
            pathB[0] = address(rewardToken);
            pathB[1] = address(tokenB);

            // Swap half for Token A
            router.swapExactTokensForTokens(
                halfRewards,
                0, // Accept any output for testing / simulation
                pathA,
                address(this),
                block.timestamp
            );

            // Swap other half for Token B
            router.swapExactTokensForTokens(
                otherHalfRewards,
                0,
                pathB,
                address(this),
                block.timestamp
            );

            // Add Liquidity to get new LP tokens
            uint256 balanceA = tokenA.balanceOf(address(this));
            uint256 balanceB = tokenB.balanceOf(address(this));

            if (balanceA > 0 && balanceB > 0) {
                tokenA.approve(address(router), balanceA);
                tokenB.approve(address(router), balanceB);

                router.addLiquidity(
                    address(tokenA),
                    address(tokenB),
                    balanceA,
                    balanceB,
                    0,
                    0,
                    address(this),
                    block.timestamp
                );
            }
        }

        // 2. Re-invest ALL LP tokens currently held in the contract back into the farm
        uint256 lpBalance = asset.balanceOf(address(this));
        if (lpBalance > 0) {
            require(address(this).balance >= feeTinybars, "Insufficient HBAR in strategy for SaucerSwap deposit fee");
            asset.approve(address(farm), lpBalance);
            farm.deposit{value: feeTinybars}(poolId, lpBalance);
            stakedBalance += lpBalance;
            emit Harvested(rewards, lpBalance);
        }

        // 3. Refund any remaining HBAR back to the keeper bot (msg.sender)
        uint256 remainingHbar = address(this).balance;
        if (remainingHbar > 0) {
            (bool success, ) = payable(msg.sender).call{value: remainingHbar}("");
            require(success, "Refund failed");
        }
    }

    /**
     * @notice Returns the total assets managed by this strategy (staked in farm + liquid in strategy).
     */
    function totalManagedAssets() public view override returns (uint256) {
        return stakedBalance + asset.balanceOf(address(this));
    }
}
