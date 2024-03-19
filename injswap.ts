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
  MsgExecuteContractCompat
} from '@injectivelabs/sdk-ts'
import {
  DEFAULT_STD_FEE,
  DEFAULT_BLOCK_TIMEOUT_HEIGHT,
  BigNumberInBase,
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

const swap = async () => {
  try {

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

    const belief_price = 10
    const max_spread = 10
    const to = injectiveAddress
    const deadline = 100000000000000
    /** Preparing the transaction */
    const swapMsg = MsgExecuteContract.fromJSON({
      contractAddress: 'inj1t6g03pmc0qcgr7z44qjzaen804f924xke6menl',
      sender: injectiveAddress,
      exec: {
        action: 'Swap',
        msg: {
          offer_asset,
          belief_price,
          max_spread,
          to,
          deadline
        }
      }
    })

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
    console.log(`Transaction Hash: ${TxClient.hash(txRaw)}`);

    const txService = new TxGrpcClient(network.grpc);
    const detailKeys = Object.keys(txService);
    const detailValues = Object.values(txService);
    console.log(detailValues, '\n', detailKeys)

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

swap()