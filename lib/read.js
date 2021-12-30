/*
  A library for reading the P2WDB (pay-to-write database)
*/

// Constants that can be customized.
const SERVER = 'https://p2wdb.fullstack.cash'
// const EXPLORER_URL = 'https://explorer.bitcoin.com/bch/tx/'

// Public npm libraries.
const axios = require('axios')

class ReadP2wdb {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.axios = axios
    this.serverURL = localConfig.serverURL || SERVER
  }

  // Get paginated results.
  async getPage (page = 0) {
    const options = {
      method: 'GET',
      url: `${this.serverURL}/entry/all/${page}`,
      data: {}
    }

    const result = await this.axios.request(options)

    return result.data.data
  }

  // Get a single entry given its hash.
  async getByHash (hash) {
    const options = {
      method: 'GET',
      url: `${this.serverURL}/entry/hash/${hash}`
    }

    const result = await this.axios.request(options)

    return result.data.data
  }

  // Get an entry by its TXID
  async getByTxid (txid) {
    const options = {
      method: 'GET',
      url: `${this.serverURL}/entry/txid/${txid}`
    }

    const result = await this.axios.request(options)

    return result.data.data
  }

  async getByAppId (id) {
    const options = {
      method: 'GET',
      url: `${this.serverURL}/entry/appid/${id}`
    }

    const result = await this.axios.request(options)

    return result.data.data
  }
}

module.exports = ReadP2wdb
