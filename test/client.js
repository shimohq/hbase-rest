import test from 'ava'
import is from 'is'

import HBase from '..'
import config from './fixtures/config'

test('HBase', t => {
  t.true(is.fn(HBase))
})

test('new HBase()', t => {
  let client = new HBase()
  t.true(is.object(client))
  t.true(is.object(client.options))
  t.is(client.options.protocol, 'http:')
  t.is(client.options.host, 'localhost')
  t.is(client.options.port, 8080)

  client = new HBase('localhost')
  t.true(is.object(client))
  t.true(is.object(client.options))
  t.is(client.options.protocol, 'http:')
  t.is(client.options.host, 'localhost')
  t.is(client.options.port, 8080)

  t.true(is.fn(client.table))

  client = new HBase('localhost:1234')
  t.true(is.object(client))
  t.true(is.object(client.options))
  t.is(client.options.protocol, 'http:')
  t.is(client.options.host, 'localhost')
  t.is(client.options.port, 1234)

  t.true(is.fn(client.table))
})

test('new HBase() throws error if options invalid', t => {
  let err = t.throws(() => new HBase({ host () { } }))
  t.is(err.message, '`host` requires a string')

  err = t.throws(() => new HBase({ port: '123' }))
  t.is(err.message, '`port` requires an integer')
})

test('client.version()', async t => {
  const client = new HBase(config.hbase)
  t.true(is.string(await client.version()))
})

test('client.status()', async t => {
  const client = new HBase(config.hbase)
  const status = await client.status()

  t.true(is.object(status))

  for (const prop of ['regions', 'averageLoad', 'requests', 'LiveNodes', 'DeadNodes']) {
    t.true(status.hasOwnProperty(prop))
  }
})
