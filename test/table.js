import test from 'ava'
import is from 'is'

import HBase from '..'
import config from './fixtures/config'
import randomName from './helpers/random-name'

test.beforeEach(t => {
  t.context.client = new HBase(config.hbase)
})

test('List all table', async t => {
  const tn = randomName()
  const table = t.context.client.table(tn)
  await table.create({
    ColumnSchema: [{
      name: 'cf'
    }]
  })

  const tables = await t.context.client.tables()
  t.true(is.array(tables))
  t.true(tables.some(table => table.name === tn))
})

test('Table', async t => {
  const err = await t.throws(t.context.client.table('table_should_not_exists').stat())
  t.true(/not found/i.test(err.message))
})

test('Table.create()', async t => {
  const tn = randomName()
  const table = t.context.client.table(tn)
  await table.create({
    ColumnSchema: [{
      name: 'cf'
    }]
  })

  const res = await table.stat()
  t.is(res.name, tn)
  t.is(res.ColumnSchema.length, 1)
  t.is(res.ColumnSchema[0].name, 'cf')
})

test('Table.create() with namespace', async t => {
  const tn = randomName()
  const table = t.context.client.table(tn, { namespace: 'hbase' })
  await table.create({
    ColumnSchema: [{
      name: 'cf'
    }]
  })

  const stat = await table.stat()
  t.is(stat.name, `hbase:${tn}`)
  t.is(stat.ColumnSchema.length, 1)
  t.is(stat.ColumnSchema[0].name, 'cf')
})

test('Table.update()', async t => {
  const tn = randomName()
  const table = t.context.client.table(tn)
  await table.create({
    ColumnSchema: [{
      name: 'cf'
    }]
  })

  let stat = await table.stat()
  t.is(stat.ColumnSchema.length, 1)
  t.is(stat.ColumnSchema[0].KEEP_DELETED_CELLS.toLowerCase(), 'false')

  await table.update({
    ColumnSchema: [{
      name: 'cf',
      KEEP_DELETED_CELLS: true
    }]
  })

  stat = await table.stat()
  t.is(stat.ColumnSchema[0].KEEP_DELETED_CELLS.toLowerCase(), 'true')

  await table.update({
    ColumnSchema: [{
      name: 'cf2'
    }]
  })

  stat = await table.stat()
  t.is(stat.ColumnSchema.length, 1)
  t.is(stat.ColumnSchema[0].name, 'cf2')
})

test('Table.delete()', async t => {
  const tn = randomName()
  const table = t.context.client.table(tn)
  await table.create({
    ColumnSchema: [{
      name: 'cf'
    }]
  })

  t.truthy(await table.stat())
  await table.delete()
  const err = await t.throws(table.stat())
  t.true(/not found/i.test(err.message))
})

test('Table.stat()', async t => {
  const tn = randomName()
  const table = t.context.client.table(tn)
  await table.create({
    ColumnSchema: [{
      name: 'cf'
    }]
  })

  const stat = await table.stat()
  t.is(stat.name, tn)
  t.is(stat.ColumnSchema.length, 1)
  t.is(stat.ColumnSchema[0].name, 'cf')
})

test('Table.stat() throws error', async t => {
  const err = await t.throws(t.context.client.table('fake_table').stat())
  t.true(err instanceof Error)
  t.true(/not found/i.test(err.message))
  t.is(err.status, 404)
})

test('Table.regions()', async t => {
  const tn = randomName()
  const table = t.context.client.table(tn)
  await table.create({
    ColumnSchema: [{
      name: 'cf'
    }]
  })

  const regions = await table.regions()
  t.is(regions.name, tn)
  t.true(is.array(regions.Region))
})
