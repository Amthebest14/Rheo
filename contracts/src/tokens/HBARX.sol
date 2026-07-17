// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HBARX
 * @dev Mock HBAR Staked for testnet. 8 decimals.
 */
contract HBARX is ERC20, Ownable {
    constructor() ERC20("HBAR Staked", "HBARX") Ownable(msg.sender) {}

    function decimals() public view virtual override returns (uint8) {
        return 8;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
