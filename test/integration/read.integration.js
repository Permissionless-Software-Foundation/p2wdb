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
      const hash = 'zdpuB3Y7JM5snxZpriPxQbGYQKBcWoXyXXBg5JjpBDR4af53t'

      const result = await uut.getByHash(hash)
      // console.log('result: ', result)

      assert.property(result, 'isValid')
    })
  })

  describe('#getByTxid', () => {
    it('should get an entry by its hash', async () => {
      const txid =
      '0d40d39de19a0f0d92d030995887cc931970a908e359db2fc63f21e657715998'

      const result = await uut.getByTxid(txid)
      // console.log('result: ', result)

      assert.property(result, 'isValid')
    })
  })

  describe('#getByAppId', () => {
    it('should get an entry by its hash', async () => {
      const id = 'test'

      const result = await uut.getByAppId(id)
      // console.log('result: ', result)

      assert.isArray(result)
      assert.property(result[0], 'isValid')
      assert.isAbove(result.length, 0)
    })
  })
})
