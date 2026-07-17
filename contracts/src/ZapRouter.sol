// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {RheoVault} from "./RheoVault.sol";
import {StrategyContract} from "./StrategyContract.sol";
import {ISaucerSwapV1Router} from "./interfaces/ISaucerSwapV1Router.sol";

/**
 * @title ZapRouter
 * @author Rheo Finance
 * @notice Atomic zap into/out of Rheo ERC-4626 vaults using native HBAR or ERC-20 tokens.
 * Uses standard ERC-20 approvals for the clone environment.
 */
contract ZapRouter is ReentrancyGuard {
    ISaucerSwapV1Router public immutable router;

    event ZappedIn(
        address indexed user,
        address indexed vault,
        address tokenIn,
        uint256 amountIn,
        uint256 lpMinted,
        uint256 sharesMinted
    );

    event ZappedOut(
        address indexed user,
        address indexed vault,
        address tokenOut,
        uint256 sharesBurned,
        uint256 amountOut
    );

    constructor(ISaucerSwapV1Router _router) {
        require(address(_router) != address(0), "Invalid router address");
        router = _router;
    }

    receive() external payable {}

    // ─────────────────────────────────────────────────────────────────────────
    //  Zap In — HBAR → Vault Shares
    // ─────────────────────────────────────────────────────────────────────────

    function zapInHBAR(
        address vaultAddress,
        address whbar,
        uint256 swapAmountOutMin,
        uint256 lpAmountOutMin,
        uint256 deadline
    ) external payable nonReentrant returns (uint256 shares) {
        require(msg.value > 0, "Must send HBAR");
        require(vaultAddress != address(0), "Invalid vault");

        RheoVault vault = RheoVault(vaultAddress);
        StrategyContract strategy = StrategyContract(address(vault.strategy()));

        address tokenA = address(strategy.tokenA());
        address tokenB = address(strategy.tokenB());
        require(whbar == tokenA || whbar == tokenB, "WHBAR not in vault pair");

        address tokenOut = (whbar == tokenA) ? tokenB : tokenA;

        // ── Step 1: Swap half HBAR → tokenOut ─────────────────────────────────
        uint256 swapHBAR = msg.value / 2;
        address[] memory path = new address[](2);
        path[0] = whbar;
        path[1] = tokenOut;

        uint256[] memory amounts = router.swapExactETHForTokens{value: swapHBAR}(
            swapAmountOutMin,
            path,
            address(this),
            deadline
        );
        uint256 amountOutToken = amounts[1];

        // ── Step 2: Approve tokenOut for router ───────────────────────────────
        IERC20(tokenOut).approve(address(router), amountOutToken);

        // ── Step 3: Add liquidity HBAR + tokenOut → LP token ─────────────────
        uint256 remainingHBAR = msg.value - swapHBAR;
        (,, uint256 lpAmount) = router.addLiquidityETH{value: remainingHBAR}(
            tokenOut,
            amountOutToken,
            0,
            lpAmountOutMin,
            address(this),
            deadline
        );
        require(lpAmount > 0, "No LP minted");

        // ── Step 4: Approve LP token for vault ────────────────────────────────
        address lpToken = address(vault.asset());
        IERC20(lpToken).approve(vaultAddress, lpAmount);

        // ── Step 5: Deposit LP → get vault shares ─────────────────────────────
        shares = vault.deposit(lpAmount, msg.sender);

        // ── Step 6: Refund dust ──────────────────────────────────────────────
        uint256 dustHBAR = address(this).balance;
        if (dustHBAR > 0) {
            (bool ok, ) = msg.sender.call{value: dustHBAR}("");
            require(ok, "HBAR refund failed");
        }

        uint256 dustToken = IERC20(tokenOut).balanceOf(address(this));
        if (dustToken > 0) {
            IERC20(tokenOut).transfer(msg.sender, dustToken);
        }

        emit ZappedIn(msg.sender, vaultAddress, address(0), msg.value, lpAmount, shares);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Zap In — ERC-20 Token → Vault Shares
    // ─────────────────────────────────────────────────────────────────────────

    function zapIn(
        address vaultAddress,
        address tokenIn,
        uint256 amountIn,
        uint256 swapAmountOutMin,
        uint256 lpAmountOutMin,
        uint256 deadline
    ) external nonReentrant returns (uint256 shares) {
        require(vaultAddress != address(0), "Invalid vault");
        require(tokenIn != address(0), "Invalid tokenIn");
        require(amountIn > 0, "Amount must be > 0");

        // Pull tokenIn from user
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        RheoVault vault = RheoVault(vaultAddress);
        StrategyContract strategy = StrategyContract(address(vault.strategy()));

        address tokenA = address(strategy.tokenA());
        address tokenB = address(strategy.tokenB());
        address tokenOut;

        if (tokenIn == tokenA) {
            tokenOut = tokenB;
        } else if (tokenIn == tokenB) {
            tokenOut = tokenA;
        } else {
            revert("Token not in vault pair");
        }

        // ── Step 1: Swap half tokenIn → tokenOut ──────────────────────────────
        uint256 swapAmount = amountIn / 2;
        IERC20(tokenIn).approve(address(router), swapAmount);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint256[] memory amounts = router.swapExactTokensForTokens(
            swapAmount,
            swapAmountOutMin,
            path,
            address(this),
            deadline
        );
        uint256 amountOut = amounts[1];

        // ── Step 2: Approve both sides for addLiquidity ───────────────────────
        uint256 remainIn = amountIn - swapAmount;
        IERC20(tokenIn).approve(address(router), remainIn);
        IERC20(tokenOut).approve(address(router), amountOut);

        // ── Step 3: addLiquidity → LP ─────────────────────────────────────────
        (,, uint256 lpAmount) = router.addLiquidity(
            tokenIn,
            tokenOut,
            remainIn,
            amountOut,
            0,
            lpAmountOutMin,
            address(this),
            deadline
        );
        require(lpAmount > 0, "No LP minted");

        // ── Step 4: Approve LP for vault and deposit ──────────────────────────
        address lpToken = address(vault.asset());
        IERC20(lpToken).approve(vaultAddress, lpAmount);
        shares = vault.deposit(lpAmount, msg.sender);

        // ── Step 5: Refund dust ───────────────────────────────────────────────
        uint256 dustIn = IERC20(tokenIn).balanceOf(address(this));
        uint256 dustOut = IERC20(tokenOut).balanceOf(address(this));
        if (dustIn > 0) IERC20(tokenIn).transfer(msg.sender, dustIn);
        if (dustOut > 0) IERC20(tokenOut).transfer(msg.sender, dustOut);

        emit ZappedIn(msg.sender, vaultAddress, tokenIn, amountIn, lpAmount, shares);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Zap Out — Vault Shares → Native HBAR
    // ─────────────────────────────────────────────────────────────────────────

    function zapOutHBAR(
        address vaultAddress,
        address whbar,
        uint256 shares,
        uint256 swapAmountOutMin,
        uint256 amountOutMin,
        uint256 deadline
    ) external nonReentrant returns (uint256 hbarOut) {
        require(vaultAddress != address(0), "Invalid vault");
        require(shares > 0, "Shares must be > 0");

        RheoVault vault = RheoVault(vaultAddress);
        StrategyContract strategy = StrategyContract(address(vault.strategy()));
        address tokenA = address(strategy.tokenA());
        address tokenB = address(strategy.tokenB());
        require(whbar == tokenA || whbar == tokenB, "WHBAR not in pair");

        // ── Step 1: Pull vault shares from user ───────────────────────────────
        IERC20(address(vault)).transferFrom(msg.sender, address(this), shares);

        // ── Step 2: Redeem shares → LP tokens ────────────────────────────────
        uint256 lpAmount = vault.redeem(shares, address(this), address(this));

        // ── Step 3: Approve LP for router and remove liquidity → HBAR + tokenOut
        address lpToken = address(vault.asset());
        address tokenOut = (whbar == tokenA) ? tokenB : tokenA;
        IERC20(lpToken).approve(address(router), lpAmount);

        (uint256 amountToken, ) = router.removeLiquidityETH(
            tokenOut,
            lpAmount,
            0,
            0,
            address(this),
            deadline
        );

        // ── Step 4: Swap tokenOut → HBAR ──────────────────────────────────────
        IERC20(tokenOut).approve(address(router), amountToken);
        address[] memory path = new address[](2);
        path[0] = tokenOut;
        path[1] = whbar;

        router.swapExactTokensForETH(
            amountToken,
            swapAmountOutMin,
            path,
            address(this),
            deadline
        );

        // ── Step 5: Send ALL HBAR to user ─────────────────────────────────────
        hbarOut = address(this).balance;
        require(hbarOut >= amountOutMin, "Slippage: insufficient HBAR out");

        (bool ok, ) = msg.sender.call{value: hbarOut}("");
        require(ok, "HBAR transfer failed");

        emit ZappedOut(msg.sender, vaultAddress, whbar, shares, hbarOut);
    }
}
