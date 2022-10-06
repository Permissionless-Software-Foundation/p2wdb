/*
  Write to the P2WDB

  This library leverages the free tier of FullStack.cash, with a limit of 20
  requests per minute (RPM). If the provided wallet has a lot of UTXOs, then
  it will probably exceed the RPM limit and will throw an error.
  Small wallets, with few UTXOs, dedicated to working with P2WDB, is recommended.
*/

// Public npm libraries
const axios = require('axios')
const RetryQueue = require('@chris.troutner/retry-queue-commonjs')

// Constants that can be customized.
const P2WDB_SERVER = 'https://p2wdb.fullstack.cash'
// const P2WDB_SERVER = 'http://localhost:5010'
const PSF_TOKEN_ID =
  '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'
// const PROOF_OF_BURN_QTY = 0.01
const SAT_THRESHOLD = 5000

class Write {
  constructor (localConfig = {}) {
    // Dependency Injection
    this.bchWallet = localConfig.bchWallet
    if (!this.bchWallet) {
      throw new Error('Must pass instance of minimal-slp-wallet as bchWallet when instantiating P2WDB Write library.')
    }

    // Encapsulate dependencies
    this.axios = axios
    this.serverURL = localConfig.serverURL || P2WDB_SERVER
    this.retryQueue = new RetryQueue({
      attempts: 3,
      retryPeriod: 1000
    })

    // Default cost in PSF tokens for a write. This value will be overwritten
    // by data retrieved from the P2WDB server.
    this.writeCost = 0.133

    // Bind 'this' object to subfunctions.
    this.checkForSufficientFunds = this.checkForSufficientFunds.bind(this)
    this.burnPsf = this.burnPsf.bind(this)
    this.postEntryForPsf = this.postEntryForPsf.bind(this)
    this.postEntryForBch = this.postEntryForBch.bind(this)
  }

  // Given a data object and an app ID, this method will write the
  // data to the P2WDB. It will return an object.
  async postEntry (data, appId = 'test') {
    try {
      if (!data) {
        throw new Error('data required to write to p2wdb')
      }

      // Ensure the wallet has sufficient funds. This will throw an error if it
      // does not have enough funds.
      const { hasEnoughPsf, hasEnoughBch, bchAddr } = await this.retryQueue.addToQueue(this.checkForSufficientFunds, {})

      // Wallet controls PSF tokens. This is the preferred payment method.
      if (hasEnoughPsf) {
      // Generate a signature, to verify the address providing proof-of-burn is
      // the same one that is submitting the data.
        const now = new Date()
        const message = now.toISOString()
        const signature = this.generateSignature(message)
        // console.log(`message: ${message}`)
        // console.log(`signature: ${signature}`)

        // Burn enough PSF tokens to provide proof-of-burn.
        const burnTxid = await this.retryQueue.addToQueue(this.burnPsf, {})
        console.log(`proof-of-burn TXID: ${burnTxid}`)

        // The data object that will be recorded to the P2WDB.
        const dataObj = {
          appId,
          data,
          timestamp: now.toISOString(),
          localTimeStamp: now.toLocaleString()
        }

        // The data used to form the body of the POST REST API call.
        const bodyData = {
          txid: burnTxid,
          message,
          signature,
          data: JSON.stringify(dataObj)
        }

        // const result = await this.axios.post(
        // `${this.serverURL}/entry/write`,
        // bodyData
        // )
        const result = await this.retryQueue.addToQueue(this.postEntryForPsf, bodyData)

        return result.data
      }

      // Pay with BCH if the wallet has enough, and the P2WDB has that feature enabled.
      if (hasEnoughBch) {
      // Send required BCH to the payment address.
        const receivers = [{
          address: bchAddr,
          amountSat: this.bchWallet.bchjs.BitcoinCash.toSatoshi(hasEnoughBch)
        }]
        // console.log(`receivers: ${JSON.stringify(receivers, null, 2)}`)

        const txid = await this.retryQueue.addToQueue(this.bchWallet.send, receivers)

        // Wait a few seconds to let the payment transaction propegate.
        await this.bchWallet.bchjs.Util.sleep(3000)

        // Submit the data to be written to the P2WDB.
        const bodyData = {
          address: bchAddr,
          data,
          appId
        }
        // const result = await this.axios.post(`${this.serverURL}/entry/write/bch`,
        //   bodyData)
        const result = await this.retryQueue.addToQueue(this.postEntryForBch, bodyData)
        // console.log('result.data: ', result.data)

        // Create a data object that matches the same format as the one generated
        // when using PSF to pay the write fee.
        const objOut = {
          success: true,
          hash: result.data.hash.hash,
          paymentTxid: txid
        }

        return objOut
      }
    } catch (err) {
      console.error('Error in p2wdb/write.js/postEntry(): ', err)
      throw err
    }
  }

  // This function makes a REST API call to the P2WDB to post a new entry in
  // exchange for burning PSF. This function wraps axios in a promise-based
  // function with an object input, so that it can be called with retry-queue.
  async postEntryForPsf (bodyData) {
    const result = await this.axios.post(
    `${this.serverURL}/entry/write`,
    bodyData
    )

    return result
  }

  // This function makes a REST API call to the P2WDB to post a new entry in
  // exchange for BCH. This function wraps axios in a promise-based function
  // with an objecg input, so that it can be called with retry-queue.
  async postEntryForBch (bodyData) {
    const result = await this.axios.post(
      `${this.serverURL}/entry/write/bch`,
      bodyData
    )

    return result
  }

  // This method checks the private key to ensure it has enough BCH or PSF
  // tokens to fund a write to the P2WDB.
  // It should be called before attempting to write to the P2WDB.
  // It will return an object with the following properties:
  // {
  //   hasEnoughPsf: false if wallet does not have enough PSF. Otherwise is a
  //                 Number with the number of PSF tokens needed to
  //                 write to the P2WDB.
  //   hasEnoughBch: false if wallet does not have enough BCH. Otherwise is a
  //                 Number with the number of sats needed to write to P2WDB.
  //   bchAddr:      The address to send BCH in order to pay for a write.
  // }
  async checkForSufficientFunds () {
    try {
    // Wait for wallet to instance and update its balance.
      await this.bchWallet.walletInfoPromise

      // Refresh the wallet UTXOs.
      await this.bchWallet.initialize()

      // Get the balance of BCH in the wallet.
      const balance = await this.bchWallet.getBalance()
      // console.log('balance: ', balance)

      // Verify there is enough BCH to pay for the token burn.
      if (balance < SAT_THRESHOLD) {
        throw new Error(
          'Wallet has less than 5,000 sats, not enough funds to pay for a write.'
        )
      }

      const writeCost = await this.getWriteCostPsf()
      console.log(`P2WDB Write cost: ${writeCost} PSF tokens`)

      // Get a list of SLP tokens held by the wallet.
      const tokens = await this.bchWallet.listTokens()
      // console.log(`tokens: ${JSON.stringify(tokens, null, 2)}`)

      // Initialize state
      let hasEnoughBch = false
      let hasEnoughPsf = false

      // Verify if there is enough PSF tokens to pay for the write.
      const psfTokens = tokens.filter((x) => x.tokenId === PSF_TOKEN_ID)
      if (!psfTokens.length) {
      // Wallet has PSF no tokens

        hasEnoughPsf = false
      } else if (psfTokens[0].qty < writeCost) {
      // Wallet has PSF tokens, but not enough.

        hasEnoughPsf = false
      } else {
      // Wallet has an adaquate amount of PSF tokens to pay for a write.

        hasEnoughPsf = writeCost
      }

      let bchAddr = ''

      // If the wallet doesn't have enough PSF to pay for a write, check to see if
      // it has enough BCH, and if the P2WDB supports paying in BCH.
      if (!hasEnoughPsf) {
        try {
          const { bchCost, address } = await this.getWriteCostBch()

          if (bchCost < balance) {
            hasEnoughBch = bchCost
            bchAddr = address
          }
        } catch (err) {
        // The P2WDB instance does not support paying in BCH to write.
        /* exit quietly */
        }
      }

      if (!hasEnoughPsf && !hasEnoughBch) {
        throw new Error('Provided wallet does not have enough PSF tokens or BCH to pay for a write.')
      }

      return { hasEnoughPsf, hasEnoughBch, bchAddr }
    } catch (err) {
      console.error('Error in p2wdb/lib/write.js/checkForSufficientFunds(): ', err)
      throw err
    }
  }

  // This function will burn enough PSF to generate a proof-of-burn TXID.
  // It will return the TXID as a string.
  // It's assumed checkForSufficientFunds() is called before this function.
  async burnPsf () {
    // Ensure UTXOs are up-to-date.
    await this.bchWallet.initialize()

    const result = await this.bchWallet.burnTokens(
      this.writeCost,
      PSF_TOKEN_ID
    )
    // console.log('walletData.burnTokens() result: ', result)

    return result
  }

  // Generate a cryptographic signature, required to write to the P2WDB.
  generateSignature (message) {
    // TODO: Add input validation for message.

    const privKey = this.bchWallet.walletInfo.privateKey

    // console.log('privKey: ', privKey)
    // console.log('flags.data: ', flags.data)

    const signature = this.bchWallet.bchjs.BitcoinCash.signMessageWithPrivKey(
      privKey,
      message
    )

    return signature
  }

  // Get the cost of a write from the P2WDB, in terms of PSF tokens.
  async getWriteCostPsf () {
    const result = await this.axios.get(`${this.serverURL}/entry/cost/psf`)
    const cost = result.data.psfCost

    this.writeCost = cost

    return cost
  }

  // Get the cost of a write from the P2WDB, in terms of BCH.
  // If the P2WDB instance does not support this feature, it throws an error.
  async getWriteCostBch () {
    const result = await this.axios.get(`${this.serverURL}/entry/cost/bch`)
    // console.log(`result: ${JSON.stringify(result.data, null, 2)}`)

    const bchCost = result.data.bchCost
    const address = result.data.address

    return { bchCost, address }
  }
}

module.exports = Write
