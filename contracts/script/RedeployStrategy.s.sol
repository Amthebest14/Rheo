// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {RheoVault} from "../src/RheoVault.sol";
import {StrategyContract} from "../src/StrategyContract.sol";
import {ISaucerSwapV1Router} from "../src/interfaces/ISaucerSwapV1Router.sol";
import {ISaucerSwapYieldFarm} from "../src/interfaces/ISaucerSwapYieldFarm.sol";

contract RedeployStrategyScript is Script {
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
        // Read configuration from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address vaultAddress = parseHederaId(vm.envString("VAULT_ADDRESS"));
        address underlyingLPToken = parseHederaId(vm.envString("UNDERLYING_LP_TOKEN"));
        address tokenA = parseHederaId(vm.envString("TOKEN_A"));
        address tokenB = parseHederaId(vm.envString("TOKEN_B"));
        address rewardToken = parseHederaId(vm.envString("REWARD_TOKEN"));
        address routerAddress = parseHederaId(vm.envString("SAUCERSWAP_ROUTER"));
        address farmAddress = parseHederaId(vm.envString("SAUCERSWAP_FARM"));
        uint256 poolId = vm.envUint("POOL_ID");
        address initialOwner = parseHederaId(vm.envString("INITIAL_OWNER"));

        require(vaultAddress != address(0), "VAULT_ADDRESS must be set in .env");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy the new StrategyContract
        StrategyContract newStrategy = new StrategyContract(
            vaultAddress,
            IERC20(underlyingLPToken),
            IERC20(tokenA),
            IERC20(tokenB),
            IERC20(rewardToken),
            ISaucerSwapV1Router(routerAddress),
            ISaucerSwapYieldFarm(farmAddress),
            poolId,
            initialOwner
        );

        // 2. Update Vault to use the new strategy
        RheoVault vault = RheoVault(vaultAddress);
        vault.setStrategy(newStrategy);

        vm.stopBroadcast();
    }
}
