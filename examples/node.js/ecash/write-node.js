/*
  This is a code example for writing data to the P2WDB using node.js JavaScript.
*/

// Global npm libraries
const XecWallet = require('minimal-ecash-wallet')

// Replace this private key and public address with your own. You can generate
// new values at wallet.fullstack.cash.
const WIF = 'Kx6VgfmaV3TZL7rxBfkY7g5eJQBeSRjudxhT3rycLkj7btXq32GH'
// BCH Address: bitcoincash:qz0g9scd9jhdmr82dp8hk2rs3zrgtlj52sx8pkhxjq
// eCash address: ecash:qz0g9scd9jhdmr82dp8hk2rs3zrgtlj52sl24avu5h

const serverURL = 'https://xec-p2wdb.fullstack.cash'
// const serverURL = 'http://localhost:5010'
const restURL = 'https://xec-consumer-or1-usa.fullstackcash.nl'

const { Write } = require('../../../index')
// const { Write } = require('p2wdb')

async function writeNode () {
  try {
    // Instantiate the BCH wallet.
    const xecWallet = new XecWallet(WIF, { interface: 'consumer-api', restURL })
    await xecWallet.walletInfoPromise
    await xecWallet.initialize()

    const write = new Write({ bchWallet: xecWallet, serverURL })

    // Generate the data that will be written to the P2WDB.
    const appId = 'test'
    const data = {
      now: new Date(),
      data: 'This is some test data.'
    }

    const result = await write.postEntry(data, appId)
    console.log(`Data about P2WDB write: ${JSON.stringify(result, null, 2)}`)
  } catch (err) {
    console.error(err)
  }
}
writeNode()
