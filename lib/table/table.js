'use strict'

const is = require('is')
const assert = require('assert')
const debug = require('debug')('hbase-rest')

const Row = require('./row')
const base64 = require('../base64')

class Table {
  constructor (options, client) {
    this.tableName = options.tableName
    this.namespace = options.namespace

    this.client = client
  }

  formatUrl (pathname, tableName) {
    const tn = tableName || this.tableName

    assert(is.string(tn), `Table name: ${tn} requires a string, but saw ${typeof tn}`)

    let pieces = `${tn}/${pathname}`

    if (this.namespace) {
      return `/${this.namespace}:${pieces}`
    }

    return `/${pieces}`
  }

  async create (schema) {
    let body = {}

    if (schema) {
      body = schema
    }

    await this.client.request.post(this.formatUrl('schema'), { body })
    return this
  }

  async update (schema) {
    await this.client.request.put(this.formatUrl('schema'), { body: schema })
    return this
  }

  async exists (tableName) {
    try {
      await this.stat(tableName)
      return true
    } catch (e) {
      return false
    }
  }

  async stat (tableName) {
    return this.client.request.get(this.formatUrl('schema', tableName))
  }

  async delete (tableName) {
    await this.client.request.delete(this.formatUrl('schema', tableName))
    return this
  }

  async regions (tableName) {
    return this.client.request.get(this.formatUrl('regions', tableName))
  }

  row (rowKey) {
    return new Row(rowKey, this, this.client)
  }

  async rows (pattern) {
    if (!is.string(pattern)) {
      pattern = '*'
    }

    const res = await this.client.request.get(this.formatUrl(pattern))

    return res.Row.map(row => {
      return {
        key: base64.decode(row.key),
        Cell: row.Cell.map(Row.parseColumn)
      }
    })
  }

  async scan (options) {
    const body = formatScannerOptions(Object.assign({ batch: 10 }, options))

    if (body.filter) {
      body.filter = JSON.stringify(body.filter)
    }

    const res = await this.client.request.post(this.formatUrl('scanner'), { body, raw: true })

    const scanner = res.headers.get('location')

    assert(is.string(scanner), 'HBase server failed to create scanner or did not return scanner ID')

    let result = []

    while (true) {
      const res = await this.client.request.get(scanner, { raw: true })

      if (res.status === 204) {
        break
      }

      const data = await res.json()

      result = result.concat(data.Row.map(item => {
        return {
          key: base64.decode(item.key),
          Cell: item.Cell.map(col => Row.parseColumn(col))
        }
      }))
    }

    this.client.request.delete(scanner, { raw: true }).catch(debug)

    return result
  }
}

function formatScannerOptions (options) {
  const result = {}
  const props = ['qualifier', 'family', 'value', 'startRow', 'endRow']

  for (const [key, value] of Object.entries(options)) {
    if (is.object(value)) {
      result[key] = formatScannerOptions(value)
      continue
    }

    if (is.array(value)) {
      result[key] = value.map(formatScannerOptions)
      continue
    }

    if (props.includes(key)) {
      result[key] = base64.encode(value)
      continue
    }

    result[key] = value
  }

  return result
}

module.exports = Table
