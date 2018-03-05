'use strict'

const assert = require('assert')
const is = require('is')
const { URL } = require('url')

module.exports = function parseOptions (options) {
  if (is.string(options)) {
    options = { host: options }
  }

  let {
    host,
    port,
    protocol,
    timeout
  } = Object.assign({ host: 'localhost', port: 8080, protocol: 'http:' }, options)

  assert(is.string(host), '`host` requires a string')

  const url = new URL(host.includes('://') ? host : `${protocol}//${host}`)

  host = url.hostname

  if (url.port) {
    port = parseInt(url.port, 10)
  }

  if (url.protocol) {
    protocol = url.protocol
  }

  assert(is.integer(port), '`port` requires an integer')

  return { host, port, protocol, timeout }
}
