/*
  Unit tests for the write.js library
*/

// Public npm libraries
const assert = require('chai').assert
const sinon = require('sinon')
const cloneDeep = require('lodash.clonedeep')

// Local libraries
const Write = require('../../lib/write')
const mockDataLib = require('./mocks/write-mocks.js')

// Constants used for tests.
const WIF = 'L1tcvcqa5PztqqDH4ZEcUmHA9aSHhTau5E2Zwp1xEK5CrKBrjP3m'
// BCH Address: bitcoincash:qqkg30ryje97al52htqwvveha538y7gttywut3cdqv
// SLP Address: simpleledger:qqkg30ryje97al52htqwvveha538y7gttyz8q2dd7j

describe('#read.js', () => {
  let uut, mockData
  /** @type {sinon.SinonSandbox} */
  let sandbox

  beforeEach(() => {
    // Restore the sandbox before each test.
    sandbox = sinon.createSandbox()

    mockData = cloneDeep(mockDataLib)

    uut = new Write({ wif: WIF, noUpdate: true })
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if WIF is not included', () => {
      try {
        uut = new Write()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(
          err.message,
          'WIF private key required when instantiating P2WDB Write library.'
        )
      }
    })

    it('should use the server passed as parameter', async () => {
      const serverURL = 'http://localhost:5700'
      uut = new Write({ wif: WIF, noUpdate: true, serverURL })

      assert.property(uut, 'serverURL')
      assert.equal(uut.serverURL, serverURL)
    })

    it('should fall back to the fullstack.cash node', async () => {
      uut = new Write({ wif: WIF, noUpdate: true })

      assert.property(uut, 'serverURL')
      assert.equal(uut.serverURL, 'https://p2wdb.fullstack.cash')
    })
  })

  describe('#checkForSufficientFunds', () => {
    it('should throw error if balance is less than sat threshold', async () => {
      try {
        // Force desired code path.
        sandbox.stub(uut.bchWallet, 'getBalance').resolves(100)

        await uut.checkForSufficientFunds()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(
          err.message,
          'Wallet has less than 5,000 sats, not enough funds to pay for a write.'
        )
      }
    })

    it('should throw error if WIF controlls no PSF tokens', async () => {
      try {
        // Force desired code path.
        sandbox.stub(uut.bchWallet, 'getBalance').resolves(10000)
        sandbox.stub(uut.bchWallet, 'listTokens').resolves([])

        await uut.checkForSufficientFunds()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'Wallet has no PSF tokens.')
      }
    })

    it('should throw error if address does not have enough PSF tokens', async () => {
      try {
        // Force desired code path.
        sandbox.stub(uut.bchWallet, 'getBalance').resolves(10000)
        sandbox
          .stub(uut.bchWallet, 'listTokens')
          .resolves(mockData.tokenOutput01)

        await uut.checkForSufficientFunds()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'which is not enough')
      }
    })

    it('should return true if WIF controls adaquate resources', async () => {
      // Force desired code path.
      sandbox.stub(uut.bchWallet, 'getBalance').resolves(10000)
      mockData.tokenOutput01[0].qty = 10
      sandbox.stub(uut.bchWallet, 'listTokens').resolves(mockData.tokenOutput01)

      const result = await uut.checkForSufficientFunds()

      assert.equal(result, true)
    })
  })

  describe('#burnPsf', () => {
    it('should provide TXID proof-of-burn', async () => {
      // Mock dependencies
      sandbox.stub(uut.bchWallet, 'burnTokens').resolves('fake-txid')

      const result = await uut.burnPsf()

      assert.equal(result, 'fake-txid')
    })
  })

  describe('#generateSignature', () => {
    it('should generate a signature', async () => {
      const msg = 'test'

      const result = await uut.generateSignature(msg)
      // console.log(`result: ${result}`)

      assert.equal(
        result,
        'H3ecqjTLUTJB0pqYltPWC09YQVFMvZ3qpYYi6jTt4TxjU+mSgQV0DoB+O7W466mpLEzTqFuCD5bfhBeQfKMPKI8='
      )
    })
  })

  describe('#postEntry', () => {
    it('should post new entry to P2WDB', async () => {
      // Mock dependencies to force code path
      const serverURL = 'http://localhost:5700'
      uut = new Write({ wif: WIF, noUpdate: true, serverURL })

      sandbox.stub(uut, 'checkForSufficientFunds').resolves()
      sandbox.stub(uut, 'burnPsf').resolves('fake-txid')
      const postStub = sandbox.stub(uut.axios, 'post').resolves({ data: 'test-data' })

      const data = {
        test: 'test'
      }
      const result = await uut.postEntry(data)
      // console.log('result: ', result)

      assert.equal(result, 'test-data')
      // make sure the given serverURL is used in the axios call
      assert.include(postStub.args[0][0], serverURL)
    })
  })
})
