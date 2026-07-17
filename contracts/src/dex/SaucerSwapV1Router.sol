// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SaucerSwapPair} from "./SaucerSwapPair.sol";
import {ISaucerSwapV1Router} from "../interfaces/ISaucerSwapV1Router.sol";

interface IWHBAR {
    function deposit() external payable;
    function withdraw(uint256) external;
    function transfer(address to, uint value) external returns (bool);
    function transferFrom(address src, address dst, uint value) external returns (bool);
    function approve(address spender, uint value) external returns (bool);
}

contract SaucerSwapV1Router is ISaucerSwapV1Router, Ownable {
    address public immutable whbar;
    
    // tokenA => tokenB => pair
    mapping(address => mapping(address => address)) public getPair;

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, "Router: EXPIRED");
        _;
    }

    constructor(address _whbar) Ownable(msg.sender) {
        whbar = _whbar;
    }

    receive() external payable {
        assert(msg.sender == whbar); // only accept ETH from WHBAR contract
    }

    function registerPair(address tokenA, address tokenB, address pair) external onlyOwner {
        require(tokenA != tokenB, "Router: IDENTICAL_ADDRESSES");
        getPair[tokenA][tokenB] = pair;
        getPair[tokenB][tokenA] = pair;
    }

    function _getPair(address tokenA, address tokenB) internal view returns (SaucerSwapPair pair) {
        address pairAddress = getPair[tokenA][tokenB];
        require(pairAddress != address(0), "Router: PAIR_NOT_FOUND");
        return SaucerSwapPair(pairAddress);
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        // In our mock, we just use the desired amounts directly. 
        // A real router would compute optimal amounts if reserves exist.
        amountA = amountADesired;
        amountB = amountBDesired;
        require(amountA >= amountAMin && amountB >= amountBMin, "Router: MIN_AMOUNT_NOT_MET");

        SaucerSwapPair pair = _getPair(tokenA, tokenB);
        
        IERC20(tokenA).transferFrom(msg.sender, address(pair), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(pair), amountB);
        
        liquidity = pair.addLiquidity(amountA, amountB, to);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) public ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        SaucerSwapPair pair = _getPair(tokenA, tokenB);
        
        IERC20(address(pair)).transferFrom(msg.sender, address(this), liquidity);
        
        (uint256 amt0, uint256 amt1) = pair.removeLiquidity(liquidity, to);
        
        (amountA, amountB) = tokenA == pair.token0() ? (amt0, amt1) : (amt1, amt0);
        
        require(amountA >= amountAMin, "Router: INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "Router: INSUFFICIENT_B_AMOUNT");
    }

    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable ensure(deadline) returns (uint amountToken, uint amountETH, uint liquidity) {
        amountToken = amountTokenDesired;
        amountETH = msg.value;
        require(amountToken >= amountTokenMin && amountETH >= amountETHMin, "Router: MIN_AMOUNT_NOT_MET");

        SaucerSwapPair pair = _getPair(token, whbar);
        
        IWHBAR(whbar).deposit{value: amountETH}();
        
        IERC20(token).transferFrom(msg.sender, address(pair), amountToken);
        IERC20(whbar).transfer(address(pair), amountETH);
        
        liquidity = pair.addLiquidity(amountToken, amountETH, to);
    }

    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external ensure(deadline) returns (uint amountToken, uint amountETH) {
        (amountToken, amountETH) = removeLiquidity(
            token,
            whbar,
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        
        IERC20(token).transfer(to, amountToken);
        IWHBAR(whbar).withdraw(amountETH);
        (bool success, ) = to.call{value: amountETH}("");
        require(success, "Router: ETH_TRANSFER_FAILED");
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        
        for (uint i = 0; i < path.length - 1; i++) {
            SaucerSwapPair pair = _getPair(path[i], path[i+1]);
            
            IERC20(path[i]).transfer(address(pair), amounts[i]);
            
            address receiver = (i < path.length - 2) ? address(this) : to;
            amounts[i+1] = pair.swap(amounts[i], path[i], 0, receiver);
        }
        
        require(amounts[amounts.length - 1] >= amountOutMin, "Router: INSUFFICIENT_OUTPUT_AMOUNT");
    }

    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable ensure(deadline) returns (uint[] memory amounts) {
        require(path[0] == whbar, "Router: INVALID_PATH");
        
        amounts = new uint256[](path.length);
        amounts[0] = msg.value;
        
        IWHBAR(whbar).deposit{value: amounts[0]}();
        
        for (uint i = 0; i < path.length - 1; i++) {
            SaucerSwapPair pair = _getPair(path[i], path[i+1]);
            IERC20(path[i]).transfer(address(pair), amounts[i]);
            address receiver = (i < path.length - 2) ? address(this) : to;
            amounts[i+1] = pair.swap(amounts[i], path[i], 0, receiver);
        }
        
        require(amounts[amounts.length - 1] >= amountOutMin, "Router: INSUFFICIENT_OUTPUT_AMOUNT");
    }

    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external ensure(deadline) returns (uint[] memory amounts) {
        require(path[path.length - 1] == whbar, "Router: INVALID_PATH");
        
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        
        for (uint i = 0; i < path.length - 1; i++) {
            SaucerSwapPair pair = _getPair(path[i], path[i+1]);
            IERC20(path[i]).transfer(address(pair), amounts[i]);
            address receiver = address(this);
            amounts[i+1] = pair.swap(amounts[i], path[i], 0, receiver);
        }
        
        uint amountOut = amounts[amounts.length - 1];
        require(amountOut >= amountOutMin, "Router: INSUFFICIENT_OUTPUT_AMOUNT");
        
        IWHBAR(whbar).withdraw(amountOut);
        (bool success, ) = to.call{value: amountOut}("");
        require(success, "Router: ETH_TRANSFER_FAILED");
    }
}
