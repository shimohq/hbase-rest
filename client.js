'use strict'

const is = require('is')

const Request = require('./lib/request')
const parseOptions = require('./lib/parse-options')
const Namespace = require('./lib/namespace')
const Table = require('./lib/table')

class HBase {
  constructor (options) {
    this.options = parseOptions(options)
    this.request = new Request(this.options)
  }

  namespace (name) {
    return new Namespace(name, this)
  }

  async namespaces () {
    const res = await this.request.get('/namespaces')
    return res.Namespace
  }

  table (tableName, options) {
    let opts = tableName

    if (is.string(opts)) {
      opts = Object.assign({}, options, { tableName })
    }

    return new Table(opts, this)
  }

  async tables () {
    const res = await this.request.get('/')
    return res.table
  }

  version () {
    return this.request.get('/version/cluster')
  }

  status () {
    return this.request.get('/status/cluster')
  }
}

module.exports = HBase
