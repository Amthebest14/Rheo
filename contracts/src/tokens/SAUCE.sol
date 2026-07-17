// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SAUCE
 * @dev Mock SaucerSwap token. Minting is restricted to owner or designated farm.
 */
contract SAUCE is ERC20, Ownable {
    address public farm;

    constructor() ERC20("SaucerSwap", "SAUCE") Ownable(msg.sender) {}

    function decimals() public view virtual override returns (uint8) {
        return 8;
    }

    function setFarm(address _farm) external onlyOwner {
        farm = _farm;
    }

    function mint(address to, uint256 amount) public {
        require(msg.sender == owner() || msg.sender == farm, "SAUCE: unauthorized mint");
        _mint(to, amount);
    }
}
