import { MsgExecuteContractCompat, ExecArgCW20AdapterRedeemAndTransfer } from '@injectivelabs/sdk-ts'

const CW20_ADAPTER_CONTRACT = 'inj...'
const contractCw20Address = 'inj...'
const injectiveAddress = 'inj...'

const message = MsgExecuteContractCompat.fromJSON({
  sender: injectiveAddress,
  contractAddress: CW20_ADAPTER_CONTRACT,
  funds: {
    denom: `factory/${CW20_ADAPTER_CONTRACT}/${contractCw20Address}`,
    amount: actualAmount.toFixed()
  },
  execArgs: ExecArgCW20AdapterRedeemAndTransfer.fromJSON({
    recipient: injectiveAddress
  })
})

// Then pack the message in a transaction, sign it and broadcast to the chain