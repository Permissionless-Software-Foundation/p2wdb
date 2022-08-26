/*
  This code example shows how to pin an IPFS CID using this library.
*/

// Replace this private key and public address with your own. You can generate
// new values at wallet.fullstack.cash.
const WIF = 'L1tcvcqa5PztqqDH4ZEcUmHA9aSHhTau5E2Zwp1xEK5CrKBrjP3m'
// BCH Address: bitcoincash:qqkg30ryje97al52htqwvveha538y7gttywut3cdqv
// SLP Address: simpleledger:qqkg30ryje97al52htqwvveha538y7gttyz8q2dd7j

// Replace this with your own IPFS CID. It should be less than 1 MB in size.
const CID = 'bafybeidmxb6au63p6t7wxglks3t6rxgt6t26f3gx26ezamenznkjdnwqta'

const { Pin } = require('../../index')
// const { Pin } = require('p2wdb')

async function pinCid (cid) {
  try {
    const pin = new Pin({ wif: WIF, interface: 'consumer-api' })

    const outData = await pin.cid(cid)
    console.log('outData: ', outData)

    console.log(`IPFS CID ${CID} pinned with P2WDB entry`)
  } catch (err) {
    console.error(err)
  }
}
pinCid(CID)
