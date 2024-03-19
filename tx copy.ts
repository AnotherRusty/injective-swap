// import fs from 'fs';
// import {
//   MsgCreateSpotMarketOrder,
//   MsgBroadcasterWithPk,
//   getEthereumAddress,
//   getSpotMarketTensMultiplier,
//   spotPriceToChainPriceToFixed,
//   spotQuantityToChainQuantityToFixed,
//   ChainGrpcExchangeApi,

// } from '@injectivelabs/sdk-ts'
// // import { BigNumberInBase, spotPriceToChainPriceToFixed, spotQuantityToChainQuantityToFixed } from '@injectivelabs/utils'
// import { Network, getNetworkEndpoints } from '@injectivelabs/networks'

// const privateKey = '0x9a9044a0f632ddff421d775db93bd13eac31bb87313efb2b687abf198c9deae6'
// const injectiveAddress = 'inj15579l82y9yt8cgnrw3pqc8ur26j55jpdmwde5k'
// const feeRecipient = 'inj15579l82y9yt8cgnrw3pqc8ur26j55jpdmwde5k'
// const multi = getSpotMarketTensMultiplier({
//   baseDecimals: 18,
//   quoteDecimals: 6,
//   minPriceTickSize: 10, 
//   minQuantityTickSize: 10, 
// })
// const market = {
//   marketId: '0x03841e74624fd885d1ee28453f921d18c211e78a0d7646c792c7903054eb152c',
//   baseDecimals: 18,
//   quoteDecimals: 6,
//   minPriceTickSize: 10, /* fetched from the chain */
//   minQuantityTickSize: 10, /* fetched from the chain */
//   priceTensMultiplier: multi.priceTensMultiplier, /** can be fetched from getSpotMarketTensMultiplier */
//   quantityTensMultiplier: multi.quantityTensMultiplier, /** can be fetched from getSpotMarketTensMultiplier */
// }
// const order = {
//   price: 10,
//   quantity: 1
// }

// const ethereumAddress = getEthereumAddress(injectiveAddress)
// const subaccountIndex = 0
// const suffix = '0'.repeat(23) + subaccountIndex
// const subaccountId = ethereumAddress + suffix

// const getPostions = async () => {
//   const injectiveAddresses = ['', '']
//   console.log(1)
//   const endpoints = getNetworkEndpoints(Network.Mainnet)
//   console.log(1)
//   const chainGrpcExchangeApi = new ChainGrpcExchangeApi(endpoints.grpc)
//   console.log(1)
//   const positions = await chainGrpcExchangeApi.fetchPositions()
//   const dataJson = JSON.stringify(positions, null, 4);
//   fs.writeFile('./postions.json', dataJson, (err) => {
//     if (err) {
//       console.log('Error writing file:', err);
//     } else {
//       console.log(`wrote file`);
//     }
//   });
//   // console.log(positions)
// }
// // getPostions()
// console.log('here',subaccountId)
// const msg = MsgCreateSpotMarketOrder.fromJSON({
//   subaccountId:'0x01dd56d0a9724bf70d947f9bcb048154fe5644da000000000000000000000000',
//   injectiveAddress,
//   orderType: 1, /* Buy */
//   price: spotPriceToChainPriceToFixed({
//     value: order.price,
//     tensMultiplier: Number(market.priceTensMultiplier),
//     baseDecimals: market.baseDecimals,
//     quoteDecimals: market.quoteDecimals
//   }),
//   quantity: spotQuantityToChainQuantityToFixed({
//     value: order.quantity,
//     tensMultiplier: Number(market.quantityTensMultiplier),
//     baseDecimals: market.baseDecimals
//   }),
//   marketId: market.marketId,
//   feeRecipient: feeRecipient,
// })

// const getTxHash = async () => {
//   const txHash = await new MsgBroadcasterWithPk({
//     privateKey,
//     network: Network.Mainnet
//   }).broadcast({
//     msgs: msg
//   })
//   console.log(txHash)
// }

// getTxHash()

import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import bodyParser from "body-parser";
import express, { Router } from "express";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const swapRouter = Router();

const swap = async (chain, mnemonic, pairContract, spread, amount) => {
  try {
    // RPC url for each net
    const rpcURL = {
      main: "https://sentry.tm.injective.network:443",
      test: "https://testnet.sentry.tm.injective.network:443",
    };

    // Check current chain
    const rpc = chain == "main" ? rpcURL.main : rpcURL.test;

    // Create a wallet using the mnemonic for the specific chain prefix
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: "injective",
    });

    // Get the wallet address from the wallet
    const firstAccount = await wallet.getAccounts();
    const walletAddress = firstAccount[0].address;

    // Configure the signing client for connecting to the chain
    const signingClient = await SigningCosmWasmClient.connectWithSigner(
      rpc,
      wallet,
      { gasPrice: GasPrice.fromString("0.1injective") }
    );

    // The query takes information which contains information about the native token and an amount to send
    const beliefPrice = await client.queryContractSmart(pairContract, {
      simulation: {
        offer_asset: {
          info: {
            native_token: {
              denom: "injective",
            },
          },
          amount: amount,
        },
      },
    });

    // Create the swap message with asset details
    const swapMsg = {
      swap: {
        offer_asset: {
          info: {
            native_token: {
              denom: "injective",
            },
          },
          amount: amount,
        },
      },
      ask_asset_info: {
        native_token: {
          denom: "injective",
        },
      },
      belief_price: beliefPrice,
      max_spread: spread,
      to: walletAddress,
    };

    // Execute the swap transaction
    const executeSwap = await signingClient.execute(
      walletAddress,
      pairContractAddress,
      swapMsg,
      "auto",
      mnemonic
    );

    return executeSwap;
  } catch (error) {
    console.error("An error occurred:", error);
  }
};

// Current server port number
const PORT = 8000;

// Router for swapping on injective chain
swapRouter.post("/swap", async (req, res) => {
  try {
    const { chain, mnemonic, pairContract, spread, amount } = req.body;
    const result = await swap(chain, mnemonic, pairContract, spread, amount);
    res.json({ result: result });
  } catch (e) {
    console.log(e);
  }
});

// Configure router
app.use("/api", swapRouter);

// Test router for server is working
app.get("/", async (req, res) => {
  res.send("Server is Working!");
});

// Start server on current port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});