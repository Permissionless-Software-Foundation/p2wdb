/*
  This is a code example for reading data from the P2WDB using node.js JavaScript.
*/

const { Read } = require('../../index')
// const { Read } = require('p2wdb')

const hash = 'zdpuB3EnMBne7fePcj9saqF7rU8Zxv7hhkW4xqNNA5Sm2765o'

async function readHash () {
  try {
    const read = new Read()

    const result = await read.getByHash(hash)

    console.log(
      `P2WDB entry for hash ${hash}: ${JSON.stringify(result, null, 2)}`
    )
  } catch (err) {
    console.error(err)
  }
}
readHash()
