/*
  Pin an IPFS CID

  This is a specific kind of write to the P2WDB. Some instances of P2WDB are
  also run an IPFS pinning service that will pin content if an entry is written
  to the P2WDB with a specific format.
*/

// Constants that can be customized.
// const P2WDB_SERVER = 'https://p2wdb.fullstack.cash'
// const PSF_TOKEN_ID =
//   '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'
// // const PROOF_OF_BURN_QTY = 0.01
// const SAT_THRESHOLD = 5000

// Public npm libraries
// const BchWallet = require('minimal-slp-wallet/index')
// const axios = require('axios')

// Local libraries
const Write = require('./write')

class Pin {
  constructor (localConfig = {}) {
    // Dependency Injection
    this.bchWallet = localConfig.bchWallet
    if (!this.bchWallet) {
      throw new Error('Must pass instance of minimal-slp-wallet as bchWallet when instantiating P2WDB Write library.')
    }

    // Encapsulate dependencies
    this.write = new Write(localConfig)
  }

  // Pin an IPFS CID by writing an entry to the P2WDB with a specific format.
  async cid (cid) {
    const data = { cid }
    const appId = 'p2wdb-pin-001'

    const hash = await this.write.postEntry(data, appId)

    return hash
  }
}

module.exports = Pin
