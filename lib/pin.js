/*
  Pin a CID or JSON data with IPFS.

  This is a specific kind of write to the P2WDB. Some instances of P2WDB are
  also run an IPFS pinning service that will pin content if an entry is written
  to the P2WDB with a specific format.
*/

const DEFAULT_PIN_SERVER = 'https://p2wdb-pin.fullstack.cash'
// const DEFAULT_PIN_SERVER = 'http://localhost:5021'

// Global npm libraries
const axios = require('axios')

// Local libraries
const Write = require('./write')
const Read = require('./read')

class Pin {
  constructor (localConfig = {}) {
    // Dependency Injection
    this.bchWallet = localConfig.bchWallet
    if (!this.bchWallet) {
      throw new Error('Must pass instance of minimal-slp-wallet as bchWallet when instantiating P2WDB Write library.')
    }

    this.pinServer = localConfig.pinServer || DEFAULT_PIN_SERVER

    // Encapsulate dependencies
    this.write = new Write(localConfig)
    this.read = new Read(localConfig)
  }

  // Pin an IPFS CID by writing an entry to the P2WDB with a specific format.
  async cid (cid) {
    const data = { cid }
    const appId = 'p2wdb-pin-001'

    const hash = await this.write.postEntry(data, appId)

    return hash
  }

  // Given a P2WDB CID, this function will retrieve the JSON data from the P2WDB
  // and pin that JSON content separately to IPFS, outside the context of P2WDB.
  // It will then return the CID of that data.
  async json (p2wdbCid) {
    const result = await axios.post(`${this.pinServer}/pin-json`, { zcid: p2wdbCid })
    // console.log('json result.data: ', result.data)

    const cid = result.data.cid

    return cid
  }
}

module.exports = Pin
