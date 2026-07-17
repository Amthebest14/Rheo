// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title IExchangeRate
 * @notice Interface for the Hedera Exchange Rate precompiled system contract at address 0x168.
 */
interface IExchangeRate {
    /**
     * @notice Converts tinycents (10^-8 USD cents) to tinybars.
     * @param tinycents The USD value in tinycents.
     * @return The HBAR value in tinybars.
     */
    function tinycentsToTinybars(uint256 tinycents) external returns (uint256);

    /**
     * @notice Converts tinybars to tinycents.
     * @param tinybars The HBAR value in tinybars.
     * @return The USD value in tinycents.
     */
    function tinybarsToTinycents(uint256 tinybars) external returns (uint256);
}
