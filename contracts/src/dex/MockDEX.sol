// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISaucerSwapV1Router} from "../src/interfaces/ISaucerSwapV1Router.sol";
import {ISaucerSwapYieldFarm} from "../src/interfaces/ISaucerSwapYieldFarm.sol";

// A mock token that allows public minting for testing
contract MockToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MockSaucerSwapRouter is ISaucerSwapV1Router {
    IERC20 public lpToken;
    mapping(address => mapping(address => address)) public getPair;

    constructor(IERC20 _lpToken) {
        lpToken = _lpToken;
    }

    function registerPair(address tokenA, address tokenB, address pair) external {
        getPair[tokenA][tokenB] = pair;
        getPair[tokenB][tokenA] = pair;
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256,
        uint256,
        address to,
        uint256
    ) external override returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        // Transfer tokens from caller
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountADesired);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountBDesired);

        // Simple mock LP calculation: average of the two amounts
        liquidity = (amountADesired + amountBDesired) / 2;

        // Mint LP tokens to the user (mock LP has public minting)
        MockToken(address(lpToken)).mint(to, liquidity);

        return (amountADesired, amountBDesired, liquidity);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256,
        uint256,
        address to,
        uint256
    ) external override returns (uint256 amountA, uint256 amountB) {
        // Burn LP tokens from caller
        lpToken.transferFrom(msg.sender, address(this), liquidity);

        amountA = liquidity;
        amountB = liquidity;

        // Return tokenA and tokenB
        MockToken(tokenA).mint(to, amountA);
        MockToken(tokenB).mint(to, amountB);

        return (amountA, amountB);
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256,
        address[] calldata path,
        address to,
        uint256
    ) external override returns (uint256[] memory amounts) {
        // Transfer path[0] from caller
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        // Simple 1-to-1 mock swap
        amounts[1] = amountIn;

        // Mint output token to 'to'
        MockToken(path[1]).mint(to, amounts[1]);

        return amounts;
    }

    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint,
        uint,
        address to,
        uint
    ) external payable override returns (uint amountToken, uint amountETH, uint liquidity) {
        // Pull ERC20 token
        IERC20(token).transferFrom(msg.sender, address(this), amountTokenDesired);

        // Calculate liquidity based on average
        liquidity = (amountTokenDesired + msg.value) / 2;

        address pair = getPair[token][address(0)]; // We use address(0) to denote ETH/HBAR
        require(pair != address(0), "Pair not found");

        MockToken(pair).mint(to, liquidity);

        return (amountTokenDesired, msg.value, liquidity);
    }

    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint,
        uint,
        address to,
        uint
    ) external override returns (uint amountToken, uint amountETH) {
        // Burn LP tokens
        lpToken.transferFrom(msg.sender, address(this), liquidity);

        amountToken = liquidity;
        amountETH = liquidity;

        // Return token
        MockToken(token).mint(to, amountToken);

        // Return HBAR
        (bool ok, ) = to.call{value: amountETH}("");
        require(ok, "HBAR transfer failed");

        return (amountToken, amountETH);
    }

    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable override returns (uint[] memory amounts) {
        amounts = new uint[](2);
        amounts[0] = msg.value;
        amounts[1] = msg.value; // 1:1 mock swap

        MockToken(path[1]).mint(to, amounts[1]);

        return amounts;
    }

    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external override returns (uint[] memory amounts) {
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);

        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = amountIn; // 1:1 mock swap

        (bool ok, ) = to.call{value: amounts[1]}("");
        require(ok, "HBAR transfer failed");

        return amounts;
    }
}

contract MockFarm is ISaucerSwapYieldFarm {
    IERC20 public lpToken;
    IERC20 public rewardToken;

    mapping(uint256 => mapping(address => uint256)) public userBalances;

    constructor(IERC20 _lpToken, IERC20 _rewardToken) {
        lpToken = _lpToken;
        rewardToken = _rewardToken;
    }

    function deposit(uint256 pid, uint256 amount) external payable override {
        if (amount > 0) {
            lpToken.transferFrom(msg.sender, address(this), amount);
            userBalances[pid][msg.sender] += amount;
        } else {
            // Claim rewards - mint mock reward tokens (50 SAUCE)
            MockToken(address(rewardToken)).mint(msg.sender, 50 * 10 ** 18);
        }
    }

    function withdraw(uint256 pid, uint256 amount) external override {
        require(userBalances[pid][msg.sender] >= amount, "Withdraw amount exceeds balance");
        userBalances[pid][msg.sender] -= amount;
        lpToken.transfer(msg.sender, amount);
    }

    function pendingReward(uint256, address) external pure override returns (uint256) {
        return 50 * 10 ** 18;
    }

    function depositFee() external pure override returns (uint256) {
        return 0;
    }
}

contract MockExchangeRate {
    function tinycentsToTinybars(uint256 tinycents) external pure returns (uint256) {
        return tinycents;
    }
    
    function tinybarsToTinycents(uint256 tinybars) external pure returns (uint256) {
        return tinybars;
    }
}

