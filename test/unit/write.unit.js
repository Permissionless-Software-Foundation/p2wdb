/*
  Unit tests for the write.js library
*/

// Public npm libraries
const assert = require('chai').assert
const sinon = require('sinon')
const cloneDeep = require('lodash.clonedeep')
const BchWallet = require('minimal-slp-wallet/index')

// Local libraries
const Write = require('../../lib/write')
const mockDataLib = require('./mocks/write-mocks.js')

// Constants used for tests.
const WIF = 'L1tcvcqa5PztqqDH4ZEcUmHA9aSHhTau5E2Zwp1xEK5CrKBrjP3m'
// BCH Address: bitcoincash:qqkg30ryje97al52htqwvveha538y7gttywut3cdqv
// SLP Address: simpleledger:qqkg30ryje97al52htqwvveha538y7gttyz8q2dd7j

describe('#write.js', () => {
  let uut, mockData
  let sandbox

  beforeEach(async () => {
    // Restore the sandbox before each test.
    sandbox = sinon.createSandbox()

    mockData = cloneDeep(mockDataLib)

    const bchWallet = new BchWallet(WIF, { interface: 'consumer-api' })
    await bchWallet.walletInfoPromise
    uut = new Write({ bchWallet })
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if bchWallet is not included', () => {
      try {
        uut = new Write()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(
          err.message,
          'Must pass instance of minimal-slp-wallet as bchWallet when instantiating P2WDB Write library.'
        )
      }
    })

    it('should use the server passed as parameter', async () => {
      const bchWallet = new BchWallet(WIF, { interface: 'consumer-api' })
      const serverURL = 'http://localhost:5700'
      uut = new Write({ bchWallet, serverURL })

      assert.property(uut, 'serverURL')
      assert.equal(uut.serverURL, serverURL)
    })

    it('should fall back to the fullstack.cash node', async () => {
      const bchWallet = new BchWallet(WIF, { interface: 'consumer-api' })
      uut = new Write({ bchWallet })

      assert.property(uut, 'serverURL')
      assert.equal(uut.serverURL, 'https://p2wdb.fullstack.cash')
    })
  })

  describe('#getWriteCostPsf', () => {
    it('should get the cost of a write from P2WDB service', async () => {
      // Mock network call
      sandbox.stub(uut.axios, 'get').resolves({ data: { psfCost: 0.133 } })

      const result = await uut.getWriteCostPsf()

      assert.equal(result, 0.133)
    })
  })

  describe('#checkForSufficientFunds', () => {
    it('should throw error if balance is less than sat threshold', async () => {
      try {
        // Force desired code path.
        uut.bchWallet.isInitialized = true
        sandbox.stub(uut.bchWallet, 'getBalance').resolves(100)
        sandbox.stub(uut.bchWallet, 'initialize').resolves()

        await uut.checkForSufficientFunds()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(
          err.message,
          'Wallet has less than 5,000 sats, not enough funds to pay for a write.'
        )
      }
    })

    it('should return PSF cost if WIF controls PSF tokens', async () => {
      // Force desired code path.
      uut.bchWallet.isInitialized = true
      sandbox.stub(uut.bchWallet, 'getBalance').resolves(10000)
      mockData.tokenOutput01[0].qty = 10
      sandbox.stub(uut.bchWallet, 'listTokens').resolves(mockData.tokenOutput01)
      sandbox.stub(uut, 'getWriteCostPsf').resolves(0.133)
      sandbox.stub(uut.bchWallet, 'initialize').resolves()

      const result = await uut.checkForSufficientFunds()
      // console.log('result: ', result)

      assert.equal(result.hasEnoughPsf, 0.133)
      assert.equal(result.hasEnoughBch, false)
      assert.equal(result.bchAddr, '')
    })

    it('should return BCH cost if WIF controls BCH and no PSF tokens', async () => {
      // Force desired code path.
      uut.bchWallet.isInitialized = true
      sandbox.stub(uut.bchWallet, 'getBalance').resolves(100000)
      mockData.tokenOutput01[0].qty = 0
      sandbox.stub(uut.bchWallet, 'listTokens').resolves(mockData.tokenOutput01)
      sandbox.stub(uut, 'getWriteCostPsf').resolves(0.133)
      sandbox.stub(uut, 'getWriteCostBch').resolves({ bchCost: 10000, address: 'fake-addr' })
      sandbox.stub(uut.bchWallet, 'initialize').resolves()

      const result = await uut.checkForSufficientFunds()
      // console.log('result: ', result)

      assert.equal(result.hasEnoughPsf, false)
      assert.equal(result.hasEnoughBch, 10000)
      assert.equal(result.bchAddr, 'fake-addr')
    })

    it('should throw an error if wallet does not have enough BCH or PSF', async () => {
      // Force desired code path.
      // uut.bchWallet.isInitialized = true
      sandbox.stub(uut.bchWallet, 'initialize').resolves()
      sandbox.stub(uut.bchWallet, 'getBalance').resolves(6000)
      mockData.tokenOutput01 = []
      sandbox.stub(uut.bchWallet, 'listTokens').resolves(mockData.tokenOutput01)
      sandbox.stub(uut, 'getWriteCostPsf').resolves(0.133)
      sandbox.stub(uut, 'getWriteCostBch').resolves({ bchCost: 10000, address: 'fake-addr' })

      try {
        await uut.checkForSufficientFunds()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Provided wallet does not have enough PSF tokens or BCH to pay for a write.')
      }
    })
  })

  describe('#burnPsf', () => {
    it('should provide TXID proof-of-burn', async () => {
      // Mock dependencies
      sandbox.stub(uut.bchWallet, 'initialize').resolves()
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
    it('should post new entry to P2WDB while paying PSF tokens', async () => {
      const bchWallet = new BchWallet(WIF, { interface: 'consumer-api' })
      await bchWallet.walletInfoPromise

      const serverURL = 'http://localhost:5700'
      uut = new Write({ bchWallet, serverURL })

      // Mock dependencies to force code path
      sandbox.stub(uut, 'checkForSufficientFunds').resolves({
        hasEnoughPsf: 10,
        hasEnoughBch: false,
        bchAddr: ''
      })
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

    it('should post new entry to P2WDB while paying BCH', async () => {
      const bchWallet = new BchWallet(WIF, { interface: 'consumer-api' })
      await bchWallet.walletInfoPromise

      const serverURL = 'http://localhost:5700'
      uut = new Write({ bchWallet, serverURL })

      // Mock dependencies to force code path
      sandbox.stub(uut, 'checkForSufficientFunds').resolves({
        hasEnoughPsf: false,
        hasEnoughBch: 100000,
        bchAddr: 'fake-addr'
      })
      // sandbox.stub(uut, 'burnPsf').resolves('fake-txid')
      sandbox.stub(uut.bchWallet, 'send').resolves('fake-txid')
      sandbox.stub(uut.bchWallet.bchjs.Util, 'sleep').resolves()
      sandbox.stub(uut.axios, 'post').resolves({
        data: {
          success: true,
          hash: {
            success: true,
            hash: 'zdpuAwXjBcLRgCQMGSd5D45At7kS5kAGCQHUSbNH2aQiuL139'
          }
        }
      })

      const data = {
        test: 'test'
      }
      const result = await uut.postEntry(data)
      // console.log('result: ', result)

      assert.equal(result.hash, 'zdpuAwXjBcLRgCQMGSd5D45At7kS5kAGCQHUSbNH2aQiuL139')
      assert.equal(result.paymentTxid, 'fake-txid')
      assert.equal(result.success, true)
    })

    it('should catch, report, and throw errors', async () => {
      try {
        // Force desired code path
        await uut.postEntry()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'data required to write to p2wdb')
      }
    })
  })

  describe('#getWriteCostBch', () => {
    it('should retrieve the write cost in BCH', async () => {
      // Mock dependencies
      sandbox.stub(uut.axios, 'get').resolves({
        data: {
          bchCost: 10000,
          address: 'fake-address'
        }
      })

      const result = await uut.getWriteCostBch()

      assert.equal(result.bchCost, 10000)
      assert.equal(result.address, 'fake-address')
    })
  })
})
