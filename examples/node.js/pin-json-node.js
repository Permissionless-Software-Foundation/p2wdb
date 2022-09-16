/*
  This code example shows how to pin JSON data to the IPFS network.

  Pinning JSON data is a three step process:
  1. Write the JSON data to the P2WDB.
  2. Request the the P2WDB Pinning Service extract the data, pin it, and return
     the IPFS CID.
*/

// Global npm libraries
const BchWallet = require('minimal-slp-wallet/index')

// Replace this private key and public address with your own. You can generate
// new values at wallet.fullstack.cash.
const WIF = 'L1tcvcqa5PztqqDH4ZEcUmHA9aSHhTau5E2Zwp1xEK5CrKBrjP3m'
// BCH Address: bitcoincash:qqkg30ryje97al52htqwvveha538y7gttywut3cdqv
// SLP Address: simpleledger:qqkg30ryje97al52htqwvveha538y7gttyz8q2dd7j

// const SERVER = 'https://pearson-p2wdb.fullstackcash.nl'
const P2WDB_SERVER = 'http://localhost:5010'
const P2WDB_PINNING_SERVICE = 'http://localhost:5021'

// Local libraries
const { Pin, Write } = require('../../index')
// const { Pin, Write } = require('p2wdb')

async function pinJSON () {
  try {
    // Instantiate the BCH wallet using a private key.
    const bchWallet = new BchWallet(WIF, { interface: 'consumer-api' })
    await bchWallet.walletInfoPromise
    await bchWallet.initialize()

    // This is an example of JSON data. This can be any arbitrary data, up to
    // 10 KB is size.
    const exampleJSON = {
      about: 'This is an example of a JSON object',
      a: 'b',
      c: 42,
      image: 'https://bafybeicvlcwv3flrwa4egmroyicvghevi6uzbd56drmoerjeguu4ikpnhe.ipfs.dweb.link/psf-logo.png'
    }

    // Write JSON data to the P2WDB
    const write = new Write({ bchWallet, serverURL: P2WDB_SERVER })
    const appId = 'token-data-001' // This can be any string.
    const result3 = await write.postEntry(exampleJSON, appId)

    // This is the P2WDB CID (which starts with the letter 'z')
    const zcid = result3.hash
    console.log(`Data added to P2WDB with this zcid: ${zcid}`)

    // Request the P2WDB Pinning Service extract the data and pin it separately
    // as an IPFS CID (which starts with 'bafy').
    const pin = new Pin({ bchWallet, serverURL: P2WDB_SERVER, pinServer: P2WDB_PINNING_SERVICE })
    const result = await pin.json(zcid)
    // console.log('result ', result)
    const cid = result.cid

    console.log(`The example JSON object has been pinned to IPFS with this CID: ${cid}`)

    // const cid =
  } catch (err) {
    console.error(err)
  }
}
pinJSON()
