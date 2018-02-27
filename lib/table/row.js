'use strict'

const is = require('is')
const assert = require('assert')

const base64 = require('../base64')

class Row {
  constructor (rowKey, table, client) {
    this.rowKey = rowKey
    this.table = table
    this.client = client
  }

  static parseColumn (column) {
    const result = {}

    for (const [key, value] of Object.entries(column)) {
      if (key === 'column') {
        result[key] = base64.decode(value)
      } else if (key === '$') {
        result.value = base64.decode(value)
      } else {
        result[key] = value
      }
    }

    return result
  }

  formatUrl (rowKey) {
    const key = rowKey || this.rowKey
    assert(is.string(key), `Row key requires a string, but saw ${typeof key}`)
    return this.table.formatUrl(key)
  }

  formatColumn (column) {
    const result = {}

    for (const [key, value] of Object.entries(column)) {
      result.column = base64.encode(key)
      result.$ = base64.encode(value)
    }

    return result
  }

  async put (data) {
    let cells = []

    if (is.array(data)) {
      cells = data
    } else {
      cells = [data]
    }

    cells = cells.map(this.formatColumn)

    const body = {
      Row: [{
        key: base64.encode(this.rowKey),
        Cell: cells
      }]
    }

    await this.client.request.put(this.formatUrl(), { body })

    return this
  }

  async batchPut (data) {
    const rows = data.map(row => {
      return {
        key: base64.encode(row.key),
        Cell: row.columns.map(this.formatColumn)
      }
    })

    const body = { Row: rows }
    await this.client.request.put(this.formatUrl(rows[0].key), { body })
    return this
  }

  async get (column) {
    const res = await this.client.request.get(`${this.formatUrl()}/${column}`)
    const cell = res.Row[0].Cell[0]

    if (!cell) {
      return null
    }

    return Row.parseColumn(cell)
  }

  async deleteRow () {
    await this.client.request.delete(`${this.formatUrl()}`)
    return this
  }

  async delete (column) {
    await this.client.request.delete(`${this.formatUrl()}/${column}`)
    return this
  }
}

module.exports = Row
