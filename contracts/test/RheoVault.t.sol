// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {RheoVault} from "../src/RheoVault.sol";
import {StrategyContract} from "../src/StrategyContract.sol";
import {ZapRouter} from "../src/ZapRouter.sol";
import {MockToken, MockSaucerSwapRouter, MockFarm, MockExchangeRate} from "./MockDEX.sol";
import {ISaucerSwapV1Router} from "../src/interfaces/ISaucerSwapV1Router.sol";
import {ISaucerSwapYieldFarm} from "../src/interfaces/ISaucerSwapYieldFarm.sol";

contract RheoVaultTest is Test {
    RheoVault public vault;
    StrategyContract public strategy;
    ZapRouter public zapRouter;
    
    MockToken public lpToken;
    MockToken public tokenA;
    MockToken public tokenB;
    MockToken public rewardToken; // SAUCE

    MockSaucerSwapRouter public router;
    MockFarm public farm;

    address public owner = address(1);
    address public user = address(2);
    uint256 public poolId = 1;

    function setUp() public {
        // Deploy mock tokens
        lpToken = new MockToken("Mock SaucerSwap LP", "mLP");
        tokenA = new MockToken("Mock HBAR", "mHBAR");
        tokenB = new MockToken("Mock USDC", "mUSDC");
        rewardToken = new MockToken("Mock SAUCE", "mSAUCE");

        // Deploy Mock DEX
        router = new MockSaucerSwapRouter(IERC20(address(lpToken)));
        farm = new MockFarm(IERC20(address(lpToken)), IERC20(address(rewardToken)));

        // Etch MockExchangeRate to 0x168
        MockExchangeRate mockRate = new MockExchangeRate();
        vm.etch(address(0x0000000000000000000000000000000000000168), address(mockRate).code);

        // Setup vault and strategy
        vm.startPrank(owner);
        vault = new RheoVault(IERC20(address(lpToken)), "Rheo mLP Vault", "rheomLP", owner);

        
        strategy = new StrategyContract(
            address(vault),
            IERC20(address(lpToken)),
            IERC20(address(tokenA)),
            IERC20(address(tokenB)),
            IERC20(address(rewardToken)),
            ISaucerSwapV1Router(address(router)),
            ISaucerSwapYieldFarm(address(farm)),
            poolId,
            owner
        );
        
        vault.setStrategy(strategy);
        vm.stopPrank();

        // Deploy ZapRouter
        zapRouter = new ZapRouter(ISaucerSwapV1Router(address(router)));

        // Mint LP tokens to user for testing deposits
        lpToken.mint(user, 1000 * 10 ** 18);
        
        // Mint raw input tokens to user for testing Zaps
        tokenA.mint(user, 1000 * 10 ** 18);
    }

    function testDepositAndShares() public {
        uint256 depositAmount = 100 * 10 ** 18;

        vm.startPrank(user);
        lpToken.approve(address(vault), depositAmount);
        uint256 shares = vault.deposit(depositAmount, user);
        vm.stopPrank();

        // 1:1 conversion initially
        assertEq(shares, depositAmount);
        assertEq(vault.balanceOf(user), shares);
        
        // Strategy should hold the LP tokens as liquid balance, NOT staked yet
        assertEq(strategy.stakedBalance(), 0);
        assertEq(lpToken.balanceOf(address(strategy)), depositAmount);
        assertEq(vault.totalAssets(), depositAmount);

        // Now trigger harvest to stake
        deal(user, 10 ether);
        vm.prank(user);
        strategy.harvest{value: 1 ether}();

        // After harvest, LP should be staked in farm
        assertEq(strategy.stakedBalance(), depositAmount);
        assertEq(farm.userBalances(poolId, address(strategy)), depositAmount);
        assertEq(lpToken.balanceOf(address(strategy)), 0);
        assertEq(vault.totalAssets(), depositAmount);
    }

    function testWithdrawal() public {
        uint256 depositAmount = 100 * 10 ** 18;
        uint256 withdrawAmount = 40 * 10 ** 18;

        vm.startPrank(user);
        lpToken.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, user);
        vm.stopPrank();

        // Trigger harvest to stake so we test unstaking flow
        deal(user, 10 ether);
        vm.prank(user);
        strategy.harvest{value: 1 ether}();

        // Perform withdrawal
        vm.startPrank(user);
        vault.withdraw(withdrawAmount, user, user);
        vm.stopPrank();

        assertEq(vault.totalAssets(), depositAmount - withdrawAmount);
        assertEq(strategy.stakedBalance(), depositAmount - withdrawAmount);
        assertEq(lpToken.balanceOf(user), 1000 * 10 ** 18 - depositAmount + withdrawAmount);
    }

    function testHarvest() public {
        uint256 depositAmount = 100 * 10 ** 18;

        vm.startPrank(user);
        lpToken.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, user);
        vm.stopPrank();

        // Verify initial staked LP is 0 (liquid inside StrategyContract)
        assertEq(strategy.stakedBalance(), 0);
        assertEq(lpToken.balanceOf(address(strategy)), depositAmount);

        // Run harvest to stake the initial deposit (doesn't compound SAUCE yet because staked was 0)
        deal(user, 10 ether);
        vm.prank(user);
        strategy.harvest{value: 1 ether}();
        assertEq(strategy.stakedBalance(), depositAmount);
        assertEq(lpToken.balanceOf(address(strategy)), 0);

        // Now run second harvest to execute rewards compounding
        uint256 startGas = gasleft();
        vm.prank(user);
        strategy.harvest{value: 1 ether}();
        uint256 gasUsed = startGas - gasleft();
        emit log_named_uint("Gas used for harvest():", gasUsed);

        // The mock farm awards 50 SAUCE rewards on claim (farm.deposit(poolId, 0)).
        // 50 SAUCE is split 50/50: 25 swapped for tokenA, 25 swapped for tokenB.
        // AddLiquidity pairs 25 tokenA + 25 tokenB -> yields 25 new LP tokens.
        // Staked balance should increase by 25 LP tokens.
        uint256 expectedNewLP = 25 * 10 ** 18;
        assertEq(strategy.stakedBalance(), depositAmount + expectedNewLP);
        assertEq(vault.totalAssets(), depositAmount + expectedNewLP);
    }

    function testZapIn() public {
        uint256 zapAmount = 200 * 10 ** 18;

        vm.startPrank(user);
        tokenA.approve(address(zapRouter), zapAmount);
        
        uint256 startGas = gasleft();
        uint256 shares = zapRouter.zapIn(
            address(vault),
            address(tokenA),
            zapAmount,
            0, // swapAmountOutMin (ignore for mock)
            0, // lpAmountOutMin (ignore for mock)
            block.timestamp
        );
        uint256 gasUsed = startGas - gasleft();
        emit log_named_uint("Gas used for zapIn():", gasUsed);
        
        vm.stopPrank();

        // Assert user received shares
        assertEq(shares, 100 * 10 ** 18);
        assertEq(vault.balanceOf(user), 100 * 10 ** 18);

        // Staking is delayed so staked balance is 0, but totalAssets and managed is 100 LP
        assertEq(strategy.stakedBalance(), 0);
        assertEq(lpToken.balanceOf(address(strategy)), 100 * 10 ** 18);
        assertEq(vault.totalAssets(), 100 * 10 ** 18);

        // Trigger harvest to stake
        deal(user, 10 ether);
        vm.prank(user);
        strategy.harvest{value: 1 ether}();

        // Staked balance is now updated
        assertEq(strategy.stakedBalance(), 100 * 10 ** 18);

        // Assert router has ZERO balance of all tokens (confirming dust refund / no stranded tokens)
        assertEq(tokenA.balanceOf(address(zapRouter)), 0);
        assertEq(tokenB.balanceOf(address(zapRouter)), 0);
        assertEq(lpToken.balanceOf(address(zapRouter)), 0);
    }
}

