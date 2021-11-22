/*
  This is a code example for reading data from the P2WDB using node.js JavaScript.
*/

const { Read } = require('../../index')
// const { Read } = require('p2wdb')

const hash = 'zdpuAmJ7xBpzTrX3dJSZ3kGGWCJ12pjbcot2hTx4qavtKHb2B'

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
