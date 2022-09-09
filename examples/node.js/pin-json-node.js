/*
  This code example shows how to pin an IPFS CID using this library.
*/

// Global npm libraries
const BchWallet = require('minimal-slp-wallet/index')

// Replace this private key and public address with your own. You can generate
// new values at wallet.fullstack.cash.
const WIF = 'L1tcvcqa5PztqqDH4ZEcUmHA9aSHhTau5E2Zwp1xEK5CrKBrjP3m'
// BCH Address: bitcoincash:qqkg30ryje97al52htqwvveha538y7gttywut3cdqv
// SLP Address: simpleledger:qqkg30ryje97al52htqwvveha538y7gttyz8q2dd7j

// const SERVER = 'https://pearson-p2wdb.fullstackcash.nl'
const SERVER = 'http://localhost:5010'

const p2wdbCid = 'zdpuAqc2yMsrdM39gDyhhoCSPpoceGjaTJforddKhaGjBjVUD'

const { Pin } = require('../../index')
// const { Pin } = require('p2wdb')

async function pinCid (zcid) {
  try {
    // Instantiate the BCH wallet.
    const bchWallet = new BchWallet(WIF, { interface: 'consumer-api' })
    await bchWallet.walletInfoPromise
    await bchWallet.initialize()

    const pin = new Pin({ bchWallet, serverURL: SERVER })

    const result = await pin.json(zcid)
    console.log('result ', result)

    // const cid =
  } catch (err) {
    console.error(err)
  }
}
pinCid(p2wdbCid)
