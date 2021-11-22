/*
  Write to the P2WDB

  This library leverages the free tier of FullStack.cash, with a limit of 20
  requests per minute (RPM). If the provided wallet has a lot of UTXOs, then
  it will probably exceed the RPM limit and will throw an error.
  Small wallets, with few UTXOs, dedicated to working with P2WDB, is recommended.
*/

// Constants that can be customized.
const P2WDB_SERVER = 'https://p2wdb.fullstack.cash'
const PSF_TOKEN_ID =
  '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'
const PROOF_OF_BURN_QTY = 0.01

// Public npm libraries
const BchWallet = require('minimal-slp-wallet/index')
const axios = require('axios')

class Write {
  constructor (localConfig = {}) {
    this.wif = localConfig.wif
    if (!this.wif) {
      throw new Error(
        'WIF private key required when instantiating P2WDB Write library.'
      )
    }

    // Encapsulate dependencies
    this.bchWallet = new BchWallet(this.wif)
    this.axios = axios
  }

  // This method checks the private key to ensure it has enough BCH and PSF
  // tokens to fund a write to the P2WDB.
  // It should be called before doing any work with the wallet.
  // It will return true if funds are available, or will throw an error.
  async checkForSufficientFunds () {
    // Wait for wallet to instance and update its balance.
    await this.bchWallet.walletInfoPromise

    // Get the balance of BCH in the wallet.
    const balance = await this.bchWallet.getBalance()
    // console.log('balance: ', balance)

    // Verify there is enough BCH to pay for the token burn.
    if (balance < 5000) {
      throw new Error(
        'Wallet has less than 5,000 sats, not enough funds to pay for a write.'
      )
    }

    // Get a list of SLP tokens held by the wallet.
    const tokens = await this.bchWallet.listTokens()
    // console.log(`tokens: ${JSON.stringify(tokens, null, 2)}`)

    // Verify there is enough PSF tokens to pay for the write.
    const psfTokens = tokens.filter((x) => x.tokenId === PSF_TOKEN_ID)
    if (!psfTokens.length) {
      throw new Error('Wallet has no PSF tokens.')
    }
    if (psfTokens[0].qty < PROOF_OF_BURN_QTY) {
      throw new Error(
        `Wallet has ${psfTokens[0].qty} PSF tokens, which is not enough. ${PROOF_OF_BURN_QTY} PSF tokens are required to pay for a write.`
      )
    }

    return true
  }

  // This function will burn enough PSF to generate a proof-of-burn TXID.
  // It will return the TXID as a string.
  // It's assumed checkForSufficientFunds() is called before this function.
  async burnPsf () {
    const result = await this.bchWallet.burnTokens(
      PROOF_OF_BURN_QTY,
      PSF_TOKEN_ID
    )
    // console.log('walletData.burnTokens() result: ', result)

    return result
  }

  // Generate a cryptographic signature, required to write to the P2WDB.
  async generateSignature (message) {
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

  // Given a data object and an app ID, this method will write the
  // data to the P2WDB. It will return an object.
  async postEntry (data, appId = 'test') {
    // Ensure the wallet has sufficient funds. This will throw an error if it
    // does not have enough funds.
    await this.checkForSufficientFunds()

    // generate signature.
    const now = new Date()
    const message = now.toISOString()
    const signature = await this.generateSignature(message)

    const burnTxid = await this.burnPsf()
    console.log(`proof-of-burn TXID: ${burnTxid}`)

    const dataObj = {
      appId,
      data,
      timestamp: now.toISOString(),
      localTimeStamp: now.toLocaleString()
    }

    const bodyData = {
      txid: burnTxid,
      message,
      signature,
      data: JSON.stringify(dataObj)
    }

    const result = await this.axios.post(
      `${P2WDB_SERVER}/entry/write`,
      bodyData
    )

    return result.data
  }
}

module.exports = Write
