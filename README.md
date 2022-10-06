# P2WDB

A JavaScript npm library for reading from and writing to the [PSF](http://psfoundation.cash) pay-to-write database (P2WDB). To learn more about the P2WDB, [check out this video](https://youtu.be/korI-8W240s). Additional documentation can be found at [P2WDB.com](https://p2wdb.com).

This library is compiled with Browserify to make is usable by both node.js and browser-based JavaScript implementations. It provides convenience methods for reading from and writing to the P2WDB. [FullStack.cash](https://fullstack.cash) provides a block explorer for the P2WDB at [explorer.FullStack.cash](https://explorer.fullstack.cash).

## How To Use It?

Check out the [examples directory](./examples) for complete code examples for both node.js and browser JavaScript.

### Import

**Add to your HTML scripts**

`<script src="https://unpkg.com/p2wdb"></script>`

**Node module**

`npm install --save p2wdb`

```javascript
// module import
import P2WDB from 'p2wdb'
const { Read, Write, Pin } = P2WDB

// nodejs modules
const { Read, Write, Pin } = require('p2wdb')
```

### Read

Below are different ways to read in data from the P2WDB. Instantiating the `Read` class is easy, as it requires no dependencies:

```javascript
const { Read } = require('p2wdb')
const read = new Read()
```

#### `getPage()`

The `getPage()` method will return a 'page' of the latest 20 entries. Newer entries are served first, older entries are accessed by increasing the 'page' integer.

```javascript
// Get the second page of results.
const results = await read.getPage(2)

// Get the latest 20 entries in the database.
const result = await read.getPage() // default: page = 0
```

#### `getByAppId()`

Similar to `getPage()`, this method will return up to 20 entries, filtered by their `appId`.

```javascript
// Get the second page of results for the service metrics app.
const appId = 'psf-ipfs-metrics-0001'
const result = await read.getByAppId(appId, 2)

// Get the latest 20 entries of service metrics.
const appId = 'psf-ipfs-metrics-0001'
const result = await read.getByAppId(appId) // default: page = 0
```

#### `getByHash()`

The `getByHash()` method will return a single entry, given its unique [OrbitDB](https://orbitdb.org/) hash value.

```javascript
const hash = 'zdpuAmJ7xBpzTrX3dJSZ3kGGWCJ12pjbcot2hTx4qavtKHb2B'
const result = await read.getByHash(hash)
```

#### `getByTxid()`

The `getByTxid()` method will return an entry based on the proof-of-burn TXID used to pay for that entry.

```javascript
const hash = '4751fddd9ee2310d39dc0dbf92a5482eb1fc5301789f6d17df4363554f74842a'
const result = await read.getByTxid(hash)
```

### Write

Instantiating the `Write` class requires a [WIF private key](https://github.com/bitcoinbook/bitcoinbook/blob/a3229bbbc0c929dc53ec11365051a6782695cb52/ch04.asciidoc). The private key should have control a few cents worth of BCH.

If the private key meets those minimum requirements, it can write data to the P2WDB.

The example below is copied from the [node.js write example](./examples/node.js/write-node.js).

```javascript
// Replace this private key and public address with your own. You can generate
// new values at wallet.fullstack.cash.
const wif = 'L1tcvcqa5PztqqDH4ZEcUmHA9aSHhTau5E2Zwp1xEK5CrKBrjP3m'
// BCH Address: bitcoincash:qqkg30ryje97al52htqwvveha538y7gttywut3cdqv
// SLP Address: simpleledger:qqkg30ryje97al52htqwvveha538y7gttyz8q2dd7j

const { Write } = require('p2wdb')

async function writeNode () {
  try {
    // Instantiate the BCH wallet using a private key.
    const bchWallet = new BchWallet(wif, { interface: 'consumer-api' })
    await bchWallet.walletInfoPromise
    await bchWallet.initialize()

    const write = new Write({ bchWallet })

    // Generate the data that will be written to the P2WDB.
    const appId = 'test'
    const data = {
      now: new Date(),
      data: 'This is some test data.'
    }

    const result = await write.postEntry(data, appId)
    console.log(`Data about P2WDB write: ${JSON.stringify(result, null, 2)}`)
  } catch (err) {
    console.error(err)
  }
}
writeNode()
```

### Pin an IPFS CID

Some instances of P2WDB run the [p2wdb-pinning-service](https://github.com/Permissionless-Software-Foundation/p2wdb-pinning-service). Currently the network only supports pinning files 1MB or smaller. Pinning ensure that an IPFS node retains the data and makes it available to the IPFS network. All P2WDB instances on the network that are running the p2wdb-pinning-service will pin the content, making it widely available across the world.

Here is an example to pin a piece of content to the P2WDB pinning service:
```js
// Replace this private key and public address with your own. You can generate
// new values at wallet.fullstack.cash.
const wif = 'L1tcvcqa5PztqqDH4ZEcUmHA9aSHhTau5E2Zwp1xEK5CrKBrjP3m'
// BCH Address: bitcoincash:qqkg30ryje97al52htqwvveha538y7gttywut3cdqv
// SLP Address: simpleledger:qqkg30ryje97al52htqwvveha538y7gttyz8q2dd7j

// Replace this with your own IPFS CID. The content it represents
// should be less than 1 MB in size.
const CID = 'bafybeidmxb6au63p6t7wxglks3t6rxgt6t26f3gx26ezamenznkjdnwqta'

const { Pin } = require('p2wdb')

async function pinCid (cid) {
  try {
    // Instantiate the BCH wallet using a private key.
    const bchWallet = new BchWallet(wif, { interface: 'consumer-api' })
    await bchWallet.walletInfoPromise
    await bchWallet.initialize()

    const pin = new Pin({ bchWallet })

    const outData = await pin.cid(cid)
    console.log('outData: ', outData)

    console.log(`IPFS CID ${CID} pinned with P2WDB entry`)
  } catch (err) {
    console.error(err)
  }
}
pinCid(CID)
```

### Pin JSON Data
Often times, a developer needs to upload raw JSON data to IPFS. Instances of P2WDB running the [p2wdb-pinning-service](https://github.com/Permissionless-Software-Foundation/p2wdb-pinning-service) can retrieve JSON data uploaded to the P2WDB and pin it as its own IPFS CID. Here is an example:

```javascript
// Replace this private key and public address with your own. You can generate
// new values at wallet.fullstack.cash.
const wif = 'L1tcvcqa5PztqqDH4ZEcUmHA9aSHhTau5E2Zwp1xEK5CrKBrjP3m'
// BCH Address: bitcoincash:qqkg30ryje97al52htqwvveha538y7gttywut3cdqv
// SLP Address: simpleledger:qqkg30ryje97al52htqwvveha538y7gttyz8q2dd7j

const { Write, Pin } = require('p2wdb')

async function pinJSON () {
  try {
    // Instantiate the BCH wallet using a private key.
    const bchWallet = new BchWallet(wif, { interface: 'consumer-api' })
    await bchWallet.walletInfoPromise
    await bchWallet.initialize()

    // This is an example of JSON data. This can be any arbitrary data, up to
    // 10 KB is size.
    const exampleJSON = {
      about: 'This is an example of a JSON object',
      a: 'b',
      c: 42,
      image: 'some-image-url'
    }

    // Write JSON data to the P2WDB
    const write = new Write({ bchWallet })
    const appId = 'token-data-001' // This can be any string.
    const result1 = await write.postEntry(exampleJSON, appId)

    // This is the P2WDB CID (which starts with the letter 'z')
    const zcid = result1.hash
    console.log(`Data added to P2WDB with this zcid: ${zcid}`)

    // Request the P2WDB Pinning Service extract the data and pin it separately
    // as an IPFS CID (which starts with 'bafy').
    const pin = new Pin({ bchWallet })
    const result2 = await pin.json(zcid)
    const cid = result2.cid

    console.log(`The example JSON object has been pinned to IPFS with this CID: ${cid}`)

    // const cid =
  } catch (err) {
    console.error(err)
  }
}
pinJSON()
```




# Licence

[MIT](LICENSE.md)
