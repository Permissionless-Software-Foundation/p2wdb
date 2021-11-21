/*
  An npm JavaScript library for front end web apps. Implements a minimal
  Bitcoin Cash wallet.
*/

/* eslint-disable no-async-promise-executor */

'use strict'

const ReadP2wdb = require('./lib/read')

class P2WDB {
  constructor () {
    // Encapsulate dependencies
    this.read = new ReadP2wdb()
  }
}

module.exports = P2WDB
