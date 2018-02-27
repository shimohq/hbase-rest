import test from 'ava'
import is from 'is'

import HBase from '..'
import config from './fixtures/config'
import randomName from './helpers/random-name'

test.beforeEach(t => {
  t.context.client = new HBase(config.hbase)
})

test('List all namespaces', async t => {
  const ns = await t.context.client.namespaces()
  t.true(is.array(ns))
  t.true(ns.includes('default'))
})

test('Namespace.create()', async t => {
  const name = randomName()
  const ns = t.context.client.namespace(name)
  await ns.create()

  t.true(await ns.exists())
})

test('Namespace.delete()', async t => {
  const name = randomName()
  const ns = t.context.client.namespace(name)

  await ns.create()

  const stat = await ns.stat()
  t.true(is.object(stat))

  await ns.delete()

  t.false(await ns.exists())
})

test('Namespace.delete() throws if namespace is not empty', async t => {
  const name = randomName()
  const ns = t.context.client.namespace(name)

  await ns.create()

  await ns.table('test').create({
    ColumnSchema: [{ name: 'cf' }]
  })

  const err = await t.throws(ns.delete())
  t.true(err.message.includes('Only empty namespaces can be removed'))
  t.true(await ns.exists())
})

test('Namespace.tables()', async t => {
  const name = randomName()
  const ns = t.context.client.namespace(name)

  await ns.create()

  await ns.table('test').create({
    ColumnSchema: [{ name: 'cf' }]
  })

  const tables = await ns.tables()

  t.true(is.array(tables))
  t.true(tables.some(table => table.name === 'test'))
})
