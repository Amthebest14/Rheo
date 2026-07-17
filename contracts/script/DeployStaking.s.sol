// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {RheoStaking} from "../src/RheoStaking.sol";

contract DeployStakingScript is Script {
    function parseHederaId(string memory idStr) public pure returns (address) {
        bytes memory b = bytes(idStr);
        if (b.length >= 2 && b[0] == '0' && b[1] == 'x') {
            return parseHexAddress(idStr);
        }
        
        uint256 entityNum = 0;
        uint256 dotCount = 0;
        for (uint256 i = 0; i < b.length; i++) {
            if (b[i] == '.') {
                dotCount++;
                continue;
            }
            if (dotCount == 2) {
                uint8 digit = uint8(b[i]);
                if (digit >= 48 && digit <= 57) {
                    entityNum = entityNum * 10 + (digit - 48);
                }
            }
        }
        return address(uint160(entityNum));
    }

    function parseHexAddress(string memory s) public pure returns (address) {
        bytes memory b = bytes(s);
        uint160 result = 0;
        for (uint256 i = 2; i < b.length; i++) {
            uint8 c = uint8(b[i]);
            if (c >= 48 && c <= 57) {
                result = result * 16 + (c - 48);
            } else if (c >= 65 && c <= 70) {
                result = result * 16 + (c - 55);
            } else if (c >= 97 && c <= 102) {
                result = result * 16 + (c - 87);
            }
        }
        return address(result);
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address initialOwner = parseHederaId(vm.envString("INITIAL_OWNER"));
        address rheoToken = parseHederaId(vm.envString("RHEO_TOKEN"));
        address usdcToken = parseHederaId(vm.envString("TOKEN_B"));

        vm.startBroadcast(deployerPrivateKey);

        RheoStaking staking = new RheoStaking(
            rheoToken,
            usdcToken,
            initialOwner
        );

        vm.stopBroadcast();
    }
}
