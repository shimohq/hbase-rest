'use strict'

const is = require('is')
const assert = require('assert')

const Table = require('./table')

class Namespace {
  constructor (namespace, client) {
    this.namespace = namespace

    this.client = client
  }

  formatUrl (namespace, pathname) {
    const name = namespace || this.namespace
    assert(is.string(name), `Namespace: ${name} requires a string, but saw ${typeof name}`)
    return `/namespaces/${name}`
  }

  table (tableName) {
    return new Table(
      {
        tableName,
        namespace: this.namespace
      },
      this.client
    )
  }

  async tables (namespace) {
    const res = await this.client.request.get(`${this.formatUrl(namespace)}/tables`)
    return res.table
  }

  async create (namespace) {
    await this.client.request.post(this.formatUrl(namespace))
    return this
  }

  async exists (name) {
    try {
      const stat = await this.stat(name)
      return is.object(stat) && stat.hasOwnProperty('properties')
    } catch (e) {
      if (e.message.includes('Cannot retrieve')) {
        return false
      }
      throw e
    }
  }

  async stat (name) {
    return this.client.request.get(this.formatUrl(name))
  }

  async delete (namespace) {
    await this.client.request.delete(this.formatUrl(namespace))
    return this
  }
}

module.exports = Namespace
