'use strict'

const { v4: uuid } = require('uuid')

module.exports = () => uuid().replace(/-/g, '')
