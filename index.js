/*
  An npm JavaScript library for front end web apps. Implements a minimal
  Bitcoin Cash wallet.
*/

/* eslint-disable no-async-promise-executor */

'use strict'

const Read = require('./lib/read')
const Write = require('./lib/write')
const Pin = require('./lib/pin')

module.exports = { Read, Write, Pin }
