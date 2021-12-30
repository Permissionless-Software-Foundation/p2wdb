/*
  Unit tests for read.js library.
*/

// Public npm libraries
const assert = require('chai').assert
const sinon = require('sinon')

// Local libraries
const ReadP2wdb = require('../../lib/read')

describe('#read.js', () => {
  let uut, sandbox

  beforeEach(() => {
    // Restore the sandbox before each test.
    sandbox = sinon.createSandbox()

    uut = new ReadP2wdb()
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should use the server passed as parameter', async () => {
      const serverURL = 'http://localhost:5700'
      uut = new ReadP2wdb({ serverURL })

      assert.property(uut, 'serverURL')
      assert.equal(uut.serverURL, serverURL)
    })

    it('should fall back to the fullstack.cash node', async () => {
      uut = new ReadP2wdb()

      assert.property(uut, 'serverURL')
      assert.equal(uut.serverURL, 'https://p2wdb.fullstack.cash')
    })
  })

  describe('#getPage', () => {
    it('should get default page 0', async () => {
      // Mock dependencies
      sandbox
        .stub(uut.axios, 'request')
        .resolves({ data: { data: [{ isValid: true }] } })

      const result = await uut.getPage()
      // console.log('result: ', result)

      assert.isArray(result)
      assert.property(result[0], 'isValid')
    })
  })

  describe('#getByHash', () => {
    it('should get an entry by its hash', async () => {
      // Mock dependencies
      sandbox
        .stub(uut.axios, 'request')
        .resolves({ data: { data: { isValid: true } } })

      const hash = 'zdpuAo81epCeU5c76JK5EwMtmtMP16fyfLmLe2QhZbghAYKNS'

      const result = await uut.getByHash(hash)
      // console.log('result: ', result)

      assert.property(result, 'isValid')
    })
  })

  describe('#getByTxid', () => {
    it('should get an entry by its hash', async () => {
      // Mock dependencies
      sandbox
        .stub(uut.axios, 'request')
        .resolves({ data: { data: { isValid: true } } })

      const txid =
        'f58083223df3b4bb01b5a3f4ad4b847a42cfd6b6d27d0b342cad5056be36d7da'

      const result = await uut.getByTxid(txid)
      // console.log('result: ', result)

      assert.property(result, 'isValid')
    })
  })

  describe('#getByAppId', () => {
    it('should get an entry by its app ID', async () => {
      // Mock dependencies
      sandbox
        .stub(uut.axios, 'request')
        .resolves({ data: { data: [{ isValid: true }] } })

      const id = 'psf-ipfs-metrics-0001'

      const result = await uut.getByAppId(id)
      // console.log('result: ', result)

      assert.isArray(result)
      assert.property(result[0], 'isValid')
    })
  })
})
