// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SaucerSwapPair is ERC20 {
    address public token0;
    address public token1;

    uint256 public reserve0;
    uint256 public reserve1;

    event LiquidityAdded(uint256 amount0, uint256 amount1, uint256 liquidity);
    event LiquidityRemoved(uint256 amount0, uint256 amount1);
    event Swap(address indexed tokenIn, uint256 amountIn, uint256 amountOut);

    constructor(address _tokenA, address _tokenB) ERC20("SaucerSwap-LP", "SLP") {
        require(_tokenA != _tokenB, "Pair: IDENTICAL_ADDRESSES");
        (address token0_, address token1_) = _tokenA < _tokenB ? (_tokenA, _tokenB) : (_tokenB, _tokenA);
        require(token0_ != address(0), "Pair: ZERO_ADDRESS");
        token0 = token0_;
        token1 = token1_;
    }

    // simplistic sqrt for initial liquidity calculation
    function sqrt(uint y) internal pure returns (uint z) {
        if (y > 3) {
            z = y;
            uint x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function addLiquidity(uint256 amount0Desired, uint256 amount1Desired, address to) external returns (uint256 liquidity) {
        uint256 _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            liquidity = sqrt(amount0Desired * amount1Desired);
        } else {
            uint256 liq0 = (amount0Desired * _totalSupply) / reserve0;
            uint256 liq1 = (amount1Desired * _totalSupply) / reserve1;
            liquidity = liq0 < liq1 ? liq0 : liq1;
        }
        
        require(liquidity > 0, "Pair: INSUFFICIENT_LIQUIDITY_MINTED");
        _mint(to, liquidity);

        reserve0 += amount0Desired;
        reserve1 += amount1Desired;
        
        emit LiquidityAdded(amount0Desired, amount1Desired, liquidity);
    }

    function removeLiquidity(uint256 liquidity, address to) external returns (uint256 amount0, uint256 amount1) {
        require(balanceOf(msg.sender) >= liquidity, "Pair: INSUFFICIENT_LIQUIDITY");
        
        uint256 _totalSupply = totalSupply();
        amount0 = (liquidity * reserve0) / _totalSupply;
        amount1 = (liquidity * reserve1) / _totalSupply;
        
        require(amount0 > 0 && amount1 > 0, "Pair: INSUFFICIENT_LIQUIDITY_BURNED");
        
        _burn(msg.sender, liquidity);
        
        reserve0 -= amount0;
        reserve1 -= amount1;
        
        IERC20(token0).transfer(to, amount0);
        IERC20(token1).transfer(to, amount1);
        
        emit LiquidityRemoved(amount0, amount1);
    }

    function swap(uint256 amountIn, address tokenIn, uint256 amountOutMin, address to) external returns (uint256 amountOut) {
        require(tokenIn == token0 || tokenIn == token1, "Pair: INVALID_TOKEN");
        require(amountIn > 0, "Pair: INSUFFICIENT_INPUT_AMOUNT");
        
        bool isToken0 = tokenIn == token0;
        uint256 reserveIn = isToken0 ? reserve0 : reserve1;
        uint256 reserveOut = isToken0 ? reserve1 : reserve0;
        
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
        
        require(amountOut >= amountOutMin, "Pair: INSUFFICIENT_OUTPUT_AMOUNT");
        
        if (isToken0) {
            reserve0 += amountIn;
            reserve1 -= amountOut;
            IERC20(token1).transfer(to, amountOut);
        } else {
            reserve1 += amountIn;
            reserve0 -= amountOut;
            IERC20(token0).transfer(to, amountOut);
        }
        
        emit Swap(tokenIn, amountIn, amountOut);
    }

    function getAmountOut(uint256 amountIn, address tokenIn) external view returns (uint256 amountOut) {
        require(tokenIn == token0 || tokenIn == token1, "Pair: INVALID_TOKEN");
        if (amountIn == 0) return 0;
        
        bool isToken0 = tokenIn == token0;
        uint256 reserveIn = isToken0 ? reserve0 : reserve1;
        uint256 reserveOut = isToken0 ? reserve1 : reserve0;
        
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }
}
