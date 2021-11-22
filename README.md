# P2WDB

A JavaScript npm library for reading from and writing to the [PSF](http://psfoundation.cash) pay-to-write database (P2WDB). To learn more about the P2WDB, [check out this video](https://youtu.be/korI-8W240s).

This library is compiled with webpack to make is usable by both node.js and browser-based JavaScript implementations. It provides convenience methods for reading from and writing to the P2WDB. [FullStack.cash](https://fullstack.cash) provides a block explorer for the P2WDB at [explorer.FullStack.cash](https://explorer.fullstack.cash).

## How To Use It?

Check out the [examples directory](./examples) for complete code examples for both node.js and browser JavaScript.

### Import

**Add to your HTML scripts**

`<script src="https://unpkg.com/p2wdb"></script>`

**Node module**

`npm install p2wdb`

```javascript
// module import
import { Read, Write } from 'p2wdb'

// nodejs modules
const { Read, Write } = require('p2wdb')
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

Instantiating the `Write` class requires a [WIF private key](https://github.com/bitcoinbook/bitcoinbook/blob/a3229bbbc0c929dc53ec11365051a6782695cb52/ch04.asciidoc). The private key should have control of:

- At least 5,000 sats of BCH.
- At least 0.1 PSF tokens.

If the private key meets those minimum requirements, it can write data to the P2WDB.

The example below is copied from the [node.js write example](./examples/node.js/write-node.js).

```javascript
// Replace this private key and public address with your own. You can generate
// new keys at wallet.fullstack.cash.
const WIF = 'L1tcvcqa5PztqqDH4ZEcUmHA9aSHhTau5E2Zwp1xEK5CrKBrjP3m'
// BCH Address: bitcoincash:qqkg30ryje97al52htqwvveha538y7gttywut3cdqv
// SLP Address: simpleledger:qqkg30ryje97al52htqwvveha538y7gttyz8q2dd7j

const { Write } = require('../index')
// const { Write } = require('p2wdb')

async function writeNode() {
  try {
    const write = new Write({ wif: WIF })

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

# Licence

[MIT](LICENSE.md)
