'use strict'

const fetch = require('node-fetch')
const deepAssign = require('deep-assign')
const url = require('url')
const debug = require('debug')('hbase-rest')
const is = require('is')

const METHODS = ['get', 'post', 'put', 'delete']

class Request {
  constructor ({ host: hostname, port, protocol, timeout }) {
    this.host = url.format({ hostname, port, protocol })
    this.timeout = Number.isFinite(timeout) ? timeout : 0

    METHODS.forEach(method => {
      this[method] = (url, init) => {
        return this.request(url, Object.assign({}, init, { method }))
      }
    })
  }

  getUrl (pathname) {
    return url.format({
      host: this.host,
      pathname: pathname.startsWith('/') ? pathname : `/${pathname}`
    })
  }

  async request (pathname, init) {
    const options = deepAssign(
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json'
        },
        timeout: this.timeout
      },
      init
    )

    const dest = url.parse(pathname).protocol ? pathname : this.getUrl(pathname)

    if (/put|post/i.test(options.method) && options.body == null) {
      options.body = {}
    }

    if (options.body != null && !is.string(options.bdoy)) {
      options.body = JSON.stringify(options.body)
    }

    debug('requesting', dest, 'with', options)

    const res = await fetch(dest, options)

    if (options.raw) {
      return res
    }

    if (res.status === 201 || res.status === 204) {
      return null
    }

    const responseText = await res.text()

    if (Math.floor(res.status / 100) === 2) {
      try {
        return JSON.parse(responseText)
      } catch (e) {
        return responseText
      }
    }

    const err = new Error(responseText)
    err.status = res.status
    err.requestOptions = options
    err.requestUrl = dest
    throw err
  }
}

module.exports = Request
