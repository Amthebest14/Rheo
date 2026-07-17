// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title ISaucerSwapYieldFarm
 * @notice Interface for the SaucerSwap Yield Farm contract (MasterChef V1).
 */
interface ISaucerSwapYieldFarm {
    function deposit(uint256 pid, uint256 amount) external payable;
    function withdraw(uint256 pid, uint256 amount) external;
    function pendingReward(uint256 pid, address user) external view returns (uint256);
    function depositFee() external view returns (uint256);
}
