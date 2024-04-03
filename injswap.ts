import {
  MsgSend,
  PrivateKey,
  BaseAccount,
  ChainRestAuthApi,
  createTransaction,
  ChainRestTendermintApi,
  TxClient,
  TxGrpcClient,
  MsgExecuteContract,
  MsgExecuteContractCompat,
  InjectiveEthSecp256k1Wallet,
  InjectiveDirectEthSecp256k1Wallet,
  msgsOrMsgExecMsgs
} from '@injectivelabs/sdk-ts'
import {
  DEFAULT_STD_FEE,
  DEFAULT_BLOCK_TIMEOUT_HEIGHT,
  BigNumberInBase,
  formatWalletAddress
} from '@injectivelabs/utils'
import { ChainId } from '@injectivelabs/ts-types'
import { Network, getNetworkEndpoints, getNetworkInfo } from '@injectivelabs/networks'

const privateKeyHash = '0x9a9044a0f632ddff421d775db93bd13eac31bb87313efb2b687abf198c9deae6'
const privateKey = PrivateKey.fromHex(privateKeyHash)
const injectiveAddress = privateKey.toBech32()
const address = privateKey.toAddress()
const pubKey = privateKey.toPublicKey().toBase64()
const chainId = ChainId.Mainnet /* ChainId.Mainnet */
const restEndpoint =
  getNetworkEndpoints(Network.Mainnet).rest /* getNetworkEndpoints(Network.Mainnet).rest */
const amount = {
  amount: new BigNumberInBase(0.01).toWei().toFixed(),
  denom: 'inj',
}

const swapDojo = async () => {
  try {
    console.log('start')
    /** Account Details **/
    const chainRestAuthApi = new ChainRestAuthApi(restEndpoint)
    const accountDetailsResponse = await chainRestAuthApi.fetchAccount(
      injectiveAddress,
    )
    const baseAccount = BaseAccount.fromRestApi(accountDetailsResponse)
    const accountDetails = baseAccount.toAccountDetails()

    /** Block Details */
    const chainRestTendermintApi = new ChainRestTendermintApi(restEndpoint)
    const latestBlock = await chainRestTendermintApi.fetchLatestBlock()
    const latestHeight = latestBlock.header.height
    const timeoutHeight = new BigNumberInBase(latestHeight).plus(
      DEFAULT_BLOCK_TIMEOUT_HEIGHT,
    )

    const offer_asset = {
      info: {
        native_token: {
          denom: "inj"
        }
      },
      amount: 10
    }

    // const jsonmsg = {
    //   "execute_swap_operations": {
    //   "operations": [
    //     {
    //       "dojo_swap": {
    //         "offer_asset_info": {
    //           "native_token": {
    //             "denom": "inj"
    //           }
    //         },
    //         "ask_asset_info": {
    //           "token": {
    //             "contract_addr": "inj1aexws9pf9g0h3032fvdmxd3a9l2u9ex9aklugs"
    //           }
    //         }
    //       }
    //     },
    //     {
    //       "dojo_swap": {
    //         "offer_asset_info": {
    //           "token": {
    //             "contract_addr": "inj1aexws9pf9g0h3032fvdmxd3a9l2u9ex9aklugs"
    //           }
    //         },
    //         "ask_asset_info": {
    //           "token": {
    //             "contract_addr": "inj1l49685vnk88zfw2egf6v65se7trw2497wsqk65"
    //           }
    //         }
    //       }
    //     },
    //     {
    //       "dojo_swap": {
    //         "offer_asset_info": {
    //           "token": {
    //             "contract_addr": "inj1l49685vnk88zfw2egf6v65se7trw2497wsqk65"
    //           }
    //         },
    //         "ask_asset_info": {
    //           "token": {
    //             "contract_addr": "inj1zdj9kqnknztl2xclm5ssv25yre09f8908d4923"
    //           }
    //         }
    //       }
    //     }
    //   ],
    //   // "minimum_receive": "1000",
    //   // "deadline": 1711137193,
    //   },
    //   "sender": 'inj15579l82y9yt8cgnrw3pqc8ur26j55jpdmwde5k',
    //   "contractAddress": 'inj12eca9xszt84qm9tztyuje96nn3v2wd3v4yrzge'
    // }
    const jsonmsg = {
      // funds: {
      //   denom: string;
      //   amount: string;
      // } | {
      //   denom: string;
      //   amount: string;
      // }[];
      sender: 'inj15579l82y9yt8cgnrw3pqc8ur26j55jpdmwde5k',
      contractAddress: 'inj12eca9xszt84qm9tztyuje96nn3v2wd3v4yrzge',
      // execArgs?: ExecArgs;
      exec: {
        msg: [
          {
            "dojo_swap": {
              "offer_asset_info": {
                "native_token": {
                  "denom": "inj"
                }
              },
              "ask_asset_info": {
                "token": {
                  "contract_addr": "inj1aexws9pf9g0h3032fvdmxd3a9l2u9ex9aklugs"
                }
              }
            }
          },
          {
            "dojo_swap": {
              "offer_asset_info": {
                "token": {
                  "contract_addr": "inj1aexws9pf9g0h3032fvdmxd3a9l2u9ex9aklugs"
                }
              },
              "ask_asset_info": {
                "token": {
                  "contract_addr": "inj1l49685vnk88zfw2egf6v65se7trw2497wsqk65"
                }
              }
            }
          },
          {
            "dojo_swap": {
              "offer_asset_info": {
                "token": {
                  "contract_addr": "inj1l49685vnk88zfw2egf6v65se7trw2497wsqk65"
                }
              },
              "ask_asset_info": {
                "token": {
                  "contract_addr": "inj1zdj9kqnknztl2xclm5ssv25yre09f8908d4923"
                }
              }
            }
          }
        ],
        action: 'Swap'
      }
    }

    const swapMsg = MsgExecuteContract.fromJSON(jsonmsg)

    console.log('msg -> \n', swapMsg)

    /** Prepare the Transaction **/
    const { txRaw, signBytes } = createTransaction({
      pubKey,
      chainId,
      fee: DEFAULT_STD_FEE,
      message: swapMsg,
      sequence: baseAccount.sequence,
      timeoutHeight: timeoutHeight.toNumber(),
      accountNumber: baseAccount.accountNumber,
    })

    const signature = await privateKey.sign(Buffer.from(signBytes));
    console.log('signature -> \n', signature)


    const network = getNetworkInfo(Network.Mainnet);
    txRaw.signatures = [signature];

    /** Calculate hash of the transaction */
    console.log(`txRaw: ${JSON.stringify(txRaw)}`);
    console.log(`Transaction Hash: ${TxClient.hash(txRaw)}`);

    const txService = new TxGrpcClient(network.grpc);
    const detailKeys = Object.keys(txService);
    const detailValues = Object.values(txService);
    // console.log('detailValues', await detailValues[1].Simulate(txRaw))

    console.log(`txService: ${txService}`);
    /** Simulate transaction */
    const simulationResponse = await txService.simulate(txRaw);

    console.log(
      `Transaction simulation response: ${JSON.stringify(
        simulationResponse.gasInfo
      )}`
    );

    /** Broadcast transaction */
    const txResponse = await txService.broadcast(txRaw);

    console.log(txResponse);

    if (txResponse.code !== 0) {
      console.log(`Transaction failed: ${txResponse.rawLog}`);
    } else {
      console.log(
        `Broadcasted transaction hash: ${JSON.stringify(txResponse.txHash)}`
      );
    }
  }
  catch (e) {
    console.log(e)
  }
}

swapDojo()