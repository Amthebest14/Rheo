const { Client, TokenCreateTransaction, TokenType, PrivateKey } = require("@hashgraph/sdk");


async function main() {
    // Deployer Account ID (0.0.8064863)
    const operatorId = "0.0.8064863";
    const operatorKeyString = "0x3e3dcc9fbe7c230242bd7209b200f7bc4b3538bd0f34af98d5eb751a0bb3b74f";

    const operatorKey = PrivateKey.fromStringECDSA(operatorKeyString);

    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    console.log(`[HTS] Connecting to Hedera Testnet...`);
    console.log(`[HTS] Operator ID: ${operatorId}`);
    console.log(`[HTS] Operator EVM Address: 0x${operatorKey.publicKey.toEvmAddress()}`);

    console.log(`[HTS] Creating native fungible token 'RHEO'...`);
    
    const transaction = new TokenCreateTransaction()
        .setTokenName("Rheo Governance Token")
        .setTokenSymbol("RHEO")
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(8)
        .setInitialSupply(10000000000000000n) // 100M RHEO (100M * 10^8 decimals)

        .setTreasuryAccountId(operatorId)
        .setAdminKey(operatorKey)
        .setSupplyKey(operatorKey)
        .freezeWith(client);

    console.log(`[HTS] Signing and executing token creation transaction...`);
    const signTx = await transaction.sign(operatorKey);
    const txResponse = await signTx.execute(client);
    
    console.log(`[HTS] Transaction ID: ${txResponse.transactionId.toString()}`);
    console.log(`[HTS] Waiting for consensus receipt...`);
    
    const receipt = await txResponse.getReceipt(client);
    const tokenId = receipt.tokenId;

    console.log(`\n================================================================`);
    console.log(`[HTS] SUCCESS: HTS Token Created!`);
    console.log(`[HTS] Token ID: ${tokenId.toString()}`);
    console.log(`[HTS] EVM Redirect Address: 0x${tokenId.toSolidityAddress()}`);
    console.log(`================================================================\n`);
}

main().catch(console.error);
