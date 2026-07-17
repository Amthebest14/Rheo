// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";

import {WHBAR} from "../src/tokens/WHBAR.sol";
import {USDC} from "../src/tokens/USDC.sol";
import {DAI} from "../src/tokens/DAI.sol";
import {HBARX} from "../src/tokens/HBARX.sol";
import {SAUCE} from "../src/tokens/SAUCE.sol";
import {RheoFaucet} from "../src/tokens/RheoFaucet.sol";

import {SaucerSwapPair} from "../src/dex/SaucerSwapPair.sol";
import {SaucerSwapV1Router} from "../src/dex/SaucerSwapV1Router.sol";
import {SaucerSwapYieldFarm} from "../src/farm/SaucerSwapYieldFarm.sol";

import {RheoVault} from "../src/RheoVault.sol";
import {StrategyContract} from "../src/StrategyContract.sol";
import {ZapRouter} from "../src/ZapRouter.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISaucerSwapV1Router} from "../src/interfaces/ISaucerSwapV1Router.sol";
import {ISaucerSwapYieldFarm} from "../src/interfaces/ISaucerSwapYieldFarm.sol";

contract DeployAll is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Tokens
        WHBAR whbar = new WHBAR();
        USDC usdc = new USDC();
        DAI dai = new DAI();
        HBARX hbarx = new HBARX();
        SAUCE sauce = new SAUCE();

        // 2. Pairs
        SaucerSwapPair pairUsdcDai = new SaucerSwapPair(address(usdc), address(dai));
        SaucerSwapPair pairHbarHbarx = new SaucerSwapPair(address(whbar), address(hbarx));
        SaucerSwapPair pairUsdcHbar = new SaucerSwapPair(address(usdc), address(whbar));
        SaucerSwapPair pairUsdcSauce = new SaucerSwapPair(address(usdc), address(sauce));
        SaucerSwapPair pairDaiHbar = new SaucerSwapPair(address(dai), address(whbar));
        SaucerSwapPair pairHbarSauce = new SaucerSwapPair(address(whbar), address(sauce));

        // 3. Router
        SaucerSwapV1Router router = new SaucerSwapV1Router(address(whbar));
        router.registerPair(address(usdc), address(dai), address(pairUsdcDai));
        router.registerPair(address(whbar), address(hbarx), address(pairHbarHbarx));
        router.registerPair(address(usdc), address(whbar), address(pairUsdcHbar));
        router.registerPair(address(usdc), address(sauce), address(pairUsdcSauce));
        router.registerPair(address(dai), address(whbar), address(pairDaiHbar));
        router.registerPair(address(whbar), address(sauce), address(pairHbarSauce));

        // 4. Farm (1 SAUCE per second)
        SaucerSwapYieldFarm farm = new SaucerSwapYieldFarm(address(sauce), 1e8);
        sauce.setFarm(address(farm));

        farm.add(100, pairUsdcDai);    // pid 0
        farm.add(100, pairHbarHbarx);  // pid 1
        farm.add(100, pairUsdcHbar);   // pid 2
        farm.add(100, pairUsdcSauce);  // pid 3
        farm.add(100, pairDaiHbar);    // pid 4
        farm.add(100, pairHbarSauce);  // pid 5

        // 5. Faucet
        RheoFaucet faucet = new RheoFaucet(address(whbar), address(usdc), address(dai), address(hbarx), address(sauce));
        // Fund Faucet
        whbar.mint(address(faucet), 1_000_000 * 1e8);
        usdc.mint(address(faucet), 1_000_000 * 1e6);
        dai.mint(address(faucet), 1_000_000 * 1e6);
        hbarx.mint(address(faucet), 1_000_000 * 1e8);
        sauce.mint(address(faucet), 1_000_000 * 1e8);

        // 6. Vaults & Strategies
        RheoVault vaultUsdcDai = new RheoVault(IERC20(address(pairUsdcDai)), "Rheo USDC/DAI", "rUSDC-DAI", deployer);
        StrategyContract stratUsdcDai = new StrategyContract(address(vaultUsdcDai), IERC20(address(pairUsdcDai)), IERC20(address(usdc)), IERC20(address(dai)), IERC20(address(sauce)), ISaucerSwapV1Router(address(router)), ISaucerSwapYieldFarm(address(farm)), 0, deployer);
        vaultUsdcDai.setStrategy(stratUsdcDai);

        RheoVault vaultHbarHbarx = new RheoVault(IERC20(address(pairHbarHbarx)), "Rheo HBAR/HBARX", "rHBAR-HBARX", deployer);
        StrategyContract stratHbarHbarx = new StrategyContract(address(vaultHbarHbarx), IERC20(address(pairHbarHbarx)), IERC20(address(whbar)), IERC20(address(hbarx)), IERC20(address(sauce)), ISaucerSwapV1Router(address(router)), ISaucerSwapYieldFarm(address(farm)), 1, deployer);
        vaultHbarHbarx.setStrategy(stratHbarHbarx);

        RheoVault vaultUsdcHbar = new RheoVault(IERC20(address(pairUsdcHbar)), "Rheo USDC/HBAR", "rUSDC-HBAR", deployer);
        StrategyContract stratUsdcHbar = new StrategyContract(address(vaultUsdcHbar), IERC20(address(pairUsdcHbar)), IERC20(address(usdc)), IERC20(address(whbar)), IERC20(address(sauce)), ISaucerSwapV1Router(address(router)), ISaucerSwapYieldFarm(address(farm)), 2, deployer);
        vaultUsdcHbar.setStrategy(stratUsdcHbar);

        RheoVault vaultUsdcSauce = new RheoVault(IERC20(address(pairUsdcSauce)), "Rheo USDC/SAUCE", "rUSDC-SAUCE", deployer);
        StrategyContract stratUsdcSauce = new StrategyContract(address(vaultUsdcSauce), IERC20(address(pairUsdcSauce)), IERC20(address(usdc)), IERC20(address(sauce)), IERC20(address(sauce)), ISaucerSwapV1Router(address(router)), ISaucerSwapYieldFarm(address(farm)), 3, deployer);
        vaultUsdcSauce.setStrategy(stratUsdcSauce);

        RheoVault vaultDaiHbar = new RheoVault(IERC20(address(pairDaiHbar)), "Rheo DAI/HBAR", "rDAI-HBAR", deployer);
        StrategyContract stratDaiHbar = new StrategyContract(address(vaultDaiHbar), IERC20(address(pairDaiHbar)), IERC20(address(dai)), IERC20(address(whbar)), IERC20(address(sauce)), ISaucerSwapV1Router(address(router)), ISaucerSwapYieldFarm(address(farm)), 4, deployer);
        vaultDaiHbar.setStrategy(stratDaiHbar);

        RheoVault vaultHbarSauce = new RheoVault(IERC20(address(pairHbarSauce)), "Rheo HBAR/SAUCE", "rHBAR-SAUCE", deployer);
        StrategyContract stratHbarSauce = new StrategyContract(address(vaultHbarSauce), IERC20(address(pairHbarSauce)), IERC20(address(whbar)), IERC20(address(sauce)), IERC20(address(sauce)), ISaucerSwapV1Router(address(router)), ISaucerSwapYieldFarm(address(farm)), 5, deployer);
        vaultHbarSauce.setStrategy(stratHbarSauce);

        // 7. ZapRouter
        ZapRouter zapRouter = new ZapRouter(router);

        // 8. Seed Liquidity to all pools to prevent division by zero
        // Mint initial tokens to deployer
        whbar.mint(deployer, 1_000_000 * 1e8);
        usdc.mint(deployer, 1_000_000 * 1e6);
        dai.mint(deployer, 1_000_000 * 1e6);
        hbarx.mint(deployer, 1_000_000 * 1e8);
        sauce.mint(deployer, 1_000_000 * 1e8);

        // Approve router for everything
        whbar.approve(address(router), type(uint256).max);
        usdc.approve(address(router), type(uint256).max);
        dai.approve(address(router), type(uint256).max);
        hbarx.approve(address(router), type(uint256).max);
        sauce.approve(address(router), type(uint256).max);

        // Seed 1: USDC/DAI (1:1)
        router.addLiquidity(address(usdc), address(dai), 10_000 * 1e6, 10_000 * 1e6, 0, 0, deployer, block.timestamp + 100);
        // Seed 2: HBAR/HBARX (1:0.952)
        router.addLiquidity(address(whbar), address(hbarx), 10_000 * 1e8, 9_523 * 1e8, 0, 0, deployer, block.timestamp + 100);
        // Seed 3: USDC/HBAR ($0.10 per HBAR = 1000 HBAR : 100 USDC)
        router.addLiquidity(address(usdc), address(whbar), 1_000 * 1e6, 10_000 * 1e8, 0, 0, deployer, block.timestamp + 100);
        // Seed 4: USDC/SAUCE ($0.05 per SAUCE = 1000 SAUCE : 50 USDC)
        router.addLiquidity(address(usdc), address(sauce), 1_000 * 1e6, 20_000 * 1e8, 0, 0, deployer, block.timestamp + 100);
        // Seed 5: DAI/HBAR (same as USDC/HBAR)
        router.addLiquidity(address(dai), address(whbar), 1_000 * 1e6, 10_000 * 1e8, 0, 0, deployer, block.timestamp + 100);
        // Seed 6: HBAR/SAUCE (1 HBAR = 2 SAUCE)
        router.addLiquidity(address(whbar), address(sauce), 10_000 * 1e8, 20_000 * 1e8, 0, 0, deployer, block.timestamp + 100);

        vm.stopBroadcast();

        // Output JSON
        string memory json = "{}";
        json = vm.serializeAddress("deploy", "whbar", address(whbar));
        json = vm.serializeAddress("deploy", "usdc", address(usdc));
        json = vm.serializeAddress("deploy", "dai", address(dai));
        json = vm.serializeAddress("deploy", "hbarx", address(hbarx));
        json = vm.serializeAddress("deploy", "sauce", address(sauce));
        
        json = vm.serializeAddress("deploy", "faucet", address(faucet));
        json = vm.serializeAddress("deploy", "router", address(router));
        json = vm.serializeAddress("deploy", "farm", address(farm));
        json = vm.serializeAddress("deploy", "zapRouter", address(zapRouter));

        json = vm.serializeAddress("deploy", "vaultUsdcDai", address(vaultUsdcDai));
        json = vm.serializeAddress("deploy", "vaultHbarHbarx", address(vaultHbarHbarx));
        json = vm.serializeAddress("deploy", "vaultUsdcHbar", address(vaultUsdcHbar));
        json = vm.serializeAddress("deploy", "vaultUsdcSauce", address(vaultUsdcSauce));
        json = vm.serializeAddress("deploy", "vaultDaiHbar", address(vaultDaiHbar));
        json = vm.serializeAddress("deploy", "vaultHbarSauce", address(vaultHbarSauce));

        json = vm.serializeAddress("deploy", "stratUsdcDai", address(stratUsdcDai));
        json = vm.serializeAddress("deploy", "stratHbarHbarx", address(stratHbarHbarx));
        json = vm.serializeAddress("deploy", "stratUsdcHbar", address(stratUsdcHbar));
        json = vm.serializeAddress("deploy", "stratUsdcSauce", address(stratUsdcSauce));
        json = vm.serializeAddress("deploy", "stratDaiHbar", address(stratDaiHbar));
        json = vm.serializeAddress("deploy", "stratHbarSauce", address(stratHbarSauce));

        console2.log("=== DEPLOYMENTS JSON ===");
        console2.log(json);
    }
}
