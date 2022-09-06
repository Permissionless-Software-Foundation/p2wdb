/*
  Integration tests for the read.js library.
*/

// Public npm libraries
const assert = require('chai').assert
const BchWallet = require('minimal-slp-wallet/index')

// Local libraries
const WriteP2wdb = require('../../lib/write')

describe('#write.js', () => {
  let uut

  beforeEach(() => {
    const wif = 'L2WXayLcTiX6GoZ9Mk5tPNRDVcmYhFP5KMUU1p8sdJwXpVytXnTS'
    const bchWallet = new BchWallet(wif, { interface: 'consumer-api' })
    uut = new WriteP2wdb({ bchWallet })
  })

  describe('#getWriteCostPsf', () => {
    it('should get the write cost in PSF tokens', async () => {
      const result = await uut.getWriteCostPsf()
      // console.log('result: ', result)

      assert.isAbove(result, 0)
    })
  })

  describe('#getWriteCostBch', () => {
    it('should get the write cost in PSF tokens', async () => {
      const result = await uut.getWriteCostBch()
      // console.log('result: ', result)

      assert.isAbove(result.bchCost, 0)
      assert.include(result.address, 'bitcoincash:')
    })
  })
})
