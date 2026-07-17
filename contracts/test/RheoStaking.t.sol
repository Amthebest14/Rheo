// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {RheoStaking} from "../src/RheoStaking.sol";
import {MockToken} from "./MockDEX.sol";

contract RheoStakingTest is Test {
    RheoStaking public staking;
    MockToken public rheoToken;
    MockToken public usdcToken;

    address public alice = address(0x1111);
    address public bob = address(0x2222);
    address public owner = address(this);

    function setUp() public {
        // Deploy mock tokens
        rheoToken = new MockToken("Rheo Governance Token", "RHEO");
        usdcToken = new MockToken("USD Coin", "USDC");

        // Deploy Staking contract
        staking = new RheoStaking(
            address(rheoToken),
            address(usdcToken),
            owner
        );

        // Fund Alice and Bob
        rheoToken.mint(alice, 1000 * 1e8);
        rheoToken.mint(bob, 1000 * 1e8);

        // Mock HTS precompile call for token association
        vm.mockCall(
            address(0x167),
            abi.encodeWithSignature("associateToken(address,address)", address(staking), address(rheoToken)),
            abi.encode(int32(22))
        );
        vm.mockCall(
            address(0x167),
            abi.encodeWithSignature("associateToken(address,address)", address(staking), address(usdcToken)),
            abi.encode(int32(22))
        );
    }

    function testTokenAssociation() public {
        staking.associateToken(address(rheoToken));
        staking.associateToken(address(usdcToken));
    }

    function testStakeAndWithdraw() public {
        // Alice stakes 100 RHEO
        vm.startPrank(alice);
        rheoToken.approve(address(staking), 100 * 1e8);
        staking.stake(100 * 1e8);
        vm.stopPrank();

        assertEq(staking.totalStaked(), 100 * 1e8);
        assertEq(rheoToken.balanceOf(address(staking)), 100 * 1e8);
        assertEq(rheoToken.balanceOf(alice), 900 * 1e8);
        
        (uint256 stakedAmount, ) = staking.stakers(alice);
        assertEq(stakedAmount, 100 * 1e8);

        // Alice withdraws 40 RHEO
        vm.startPrank(alice);
        staking.withdraw(40 * 1e8);
        vm.stopPrank();

        assertEq(staking.totalStaked(), 60 * 1e8);
        assertEq(rheoToken.balanceOf(address(staking)), 60 * 1e8);
        assertEq(rheoToken.balanceOf(alice), 940 * 1e8);

        (stakedAmount, ) = staking.stakers(alice);
        assertEq(stakedAmount, 60 * 1e8);
    }

    function testRewardDistribution() public {
        // Alice stakes 100 RHEO
        vm.startPrank(alice);
        rheoToken.approve(address(staking), 100 * 1e8);
        staking.stake(100 * 1e8);
        vm.stopPrank();

        // Bob stakes 200 RHEO
        vm.startPrank(bob);
        rheoToken.approve(address(staking), 200 * 1e8);
        staking.stake(200 * 1e8);
        vm.stopPrank();

        // Owner distributes 300 USDC rewards
        usdcToken.mint(owner, 300 * 1e6);
        usdcToken.approve(address(staking), 300 * 1e6);
        staking.notifyRewardAmount(300 * 1e6);

        // Alice pending reward should be 100 USDC (1/3 of rewards)
        // Bob pending reward should be 200 USDC (2/3 of rewards)
        assertEq(staking.pendingReward(alice), 100 * 1e6);
        assertEq(staking.pendingReward(bob), 200 * 1e6);

        // Alice claims rewards
        vm.prank(alice);
        staking.claimRewards();
        assertEq(usdcToken.balanceOf(alice), 100 * 1e6);
        assertEq(staking.pendingReward(alice), 0);

        // Bob withdraws all, which also triggers claiming pending rewards
        vm.startPrank(bob);
        staking.withdraw(200 * 1e8);
        vm.stopPrank();
        assertEq(usdcToken.balanceOf(bob), 200 * 1e6);
        assertEq(rheoToken.balanceOf(bob), 1000 * 1e8); // full refund
        assertEq(staking.pendingReward(bob), 0);
    }
}
