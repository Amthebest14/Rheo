// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IStrategy {
    function vault() external view returns (address);
    function asset() external view returns (IERC20);
    function harvest() external payable;
    function invest() external;
    function withdrawToVault(uint256 amount) external;
    function totalManagedAssets() external view returns (uint256);
}
