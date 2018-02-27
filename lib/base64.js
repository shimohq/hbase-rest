'use strict'

const is = require('is')

module.exports = {
  encode (data) {
    return Buffer
      .from(is.string(data) ? data : JSON.stringify(data))
      .toString('base64')
  },

  decode (data) {
    return Buffer.from(data, 'base64').toString()
  }
}
