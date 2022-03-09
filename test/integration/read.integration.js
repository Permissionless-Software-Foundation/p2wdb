/*
  Integration tests for the read.js library.
*/

// Public npm libraries
const assert = require('chai').assert

// Local libraries
const ReadP2wdb = require('../../lib/read')

describe('#read.js', () => {
  let uut

  beforeEach(() => {
    uut = new ReadP2wdb()
  })

  describe('#getPage', () => {
    it('should get default page 0', async () => {
      const result = await uut.getPage()
      // console.log('result: ', result)

      assert.isArray(result)
      assert.property(result[0], 'isValid')
    })

    it('should get page 2', async () => {
      const result = await uut.getPage(2)
      // console.log('result: ', result)

      assert.isArray(result)
      assert.property(result[0], 'isValid')
      assert.equal(result.length, 20)
    })
  })

  describe('#getByHash', () => {
    it('should get an entry by its hash', async () => {
      const hash = 'zdpuApscHvngKSHssaVJ43Zyj6UhxvFSB94JnfxP1n14cfVvN'

      const result = await uut.getByHash(hash)
      // console.log('result: ', result)

      assert.property(result, 'isValid')
    })
  })

  describe('#getByTxid', () => {
    it('should get an entry by its hash', async () => {
      const txid =
      '129797f3989d07a40dcd18ff560f813a604566d3b60128362055fba66d11c9cf'

      const result = await uut.getByTxid(txid)
      // console.log('result: ', result)

      assert.property(result, 'isValid')
    })
  })

  describe('#getByAppId', () => {
    it('should get an entry by its hash', async () => {
      const id = 'psf-ipfs-metrics-0001'

      const result = await uut.getByAppId(id)
      // console.log('result: ', result)

      assert.isArray(result)
      assert.property(result[0], 'isValid')
      assert.equal(result.length, 20)
    })
  })
})
