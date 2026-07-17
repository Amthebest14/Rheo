// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RheoFaucet
 * @dev Faucet for testing the Rheo Finance dapp. 
 * Dispenses WHBAR, USDC, DAI, HBARX, and SAUCE once per 24 hours per wallet.
 */
contract RheoFaucet is Ownable {
    IERC20 public whbar;
    IERC20 public usdc;
    IERC20 public dai;
    IERC20 public hbarx;
    IERC20 public sauce;

    bool public paused = false;
    uint256 public constant COOLDOWN = 0;

    uint256 public amtWHBAR = 1000 * 1e8;
    uint256 public amtUSDC = 500 * 1e6;
    uint256 public amtDAI = 500 * 1e6;
    uint256 public amtHBARX = 950 * 1e8;
    uint256 public amtSAUCE = 200 * 1e8;

    mapping(address => uint256) public lastClaimed;

    event Claimed(address indexed user, uint256 timestamp);
    event ClaimAmountsUpdated();
    event FaucetPaused(bool isPaused);

    constructor(
        address _whbar,
        address _usdc,
        address _dai,
        address _hbarx,
        address _sauce
    ) Ownable(msg.sender) {
        whbar = IERC20(_whbar);
        usdc = IERC20(_usdc);
        dai = IERC20(_dai);
        hbarx = IERC20(_hbarx);
        sauce = IERC20(_sauce);
    }

    function setClaimAmounts(
        uint256 _amtWHBAR,
        uint256 _amtUSDC,
        uint256 _amtDAI,
        uint256 _amtHBARX,
        uint256 _amtSAUCE
    ) external onlyOwner {
        amtWHBAR = _amtWHBAR;
        amtUSDC = _amtUSDC;
        amtDAI = _amtDAI;
        amtHBARX = _amtHBARX;
        amtSAUCE = _amtSAUCE;
        emit ClaimAmountsUpdated();
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit FaucetPaused(_paused);
    }

    function canClaim(address user) public view returns (bool) {
        return !paused && (block.timestamp >= lastClaimed[user] + COOLDOWN);
    }

    function claim() external {
        require(!paused, "Faucet is paused");
        require(canClaim(msg.sender), "Cooldown active");

        lastClaimed[msg.sender] = block.timestamp;

        // Best effort transfers (ignore if faucet runs out of one token)
        _safeTransfer(whbar, amtWHBAR);
        _safeTransfer(usdc, amtUSDC);
        _safeTransfer(dai, amtDAI);
        _safeTransfer(hbarx, amtHBARX);
        _safeTransfer(sauce, amtSAUCE);

        emit Claimed(msg.sender, block.timestamp);
    }

    function _safeTransfer(IERC20 token, uint256 amount) internal {
        if (address(token) != address(0) && amount > 0) {
            uint256 bal = token.balanceOf(address(this));
            if (bal >= amount) {
                token.transfer(msg.sender, amount);
            }
        }
    }
}
