import test from 'ava'
import is from 'is'

import HBase from '..'
import config from './fixtures/config'
import randomName from './helpers/random-name'

test.beforeEach(async t => {
  t.context.client = new HBase(config.hbase)

  const tn = randomName()

  t.context.table = await t.context.client.table(tn).create({
    ColumnSchema: [{
      name: 'cf'
    }]
  })
})

test.afterEach(async t => {
  await t.context.table.delete()
})

test('Get rows and cells of a table', async t => {
  const rowKey = randomName()

  const row = t.context.table.row(rowKey)

  await row.put([
    {
      'cf:foo': 'foo'
    },
    {
      'cf:bar': 'bar'
    }
  ])

  const rows = await t.context.table.rows()
  t.true(is.array(rows))
  t.true(rows.every(row => row.key === rowKey))
  t.true(is.array(rows[0].Cell))
  t.true(rows.every(row => row.Cell.every(cell => cell.column === 'cf:foo' || cell.column === 'cf:bar')))
})

test('Get matched rows and cells of a table', async t => {
  const baseKey = randomName()
  const rowKey1 = `${baseKey}-${randomName()}`
  const rowKey2 = `${baseKey}-${randomName()}`

  const table = t.context.table

  await table.row(baseKey).put([{ 'cf:foo': 'foo' }])
  await table.row(rowKey1).put([{ 'cf:foo': 'foo' }])
  await table.row(rowKey2).put([{ 'cf:foo': 'foo' }])

  const rows = await t.context.table.rows(`${baseKey}-*`)
  t.is(rows.length, 2)
  t.true(rows.every(row => [rowKey1, rowKey2].includes(row.key)))
})

test('Row.put()', async t => {
  const rowKey = randomName()
  const row = t.context.table.row(rowKey)

  await row.put([
    {
      'cf:foo': 'foo'
    },
    {
      'cf:bar': 'bar'
    }
  ])

  const cell1 = await row.get('cf:foo')
  t.is(cell1.value, 'foo')

  const cell2 = await row.get('cf:bar')
  t.is(cell2.value, 'bar')
})

test('Row.batchPut() multiple rows', async t => {
  const rowKey = randomName()
  const row = t.context.table.row()

  await row.batchPut([
    {
      key: `${rowKey}-a`,
      columns: [{ 'cf:foo': 'foo' }]
    },
    {
      key: `${rowKey}-b`,
      columns: [{ 'cf:bar': 'bar' }]
    }
  ])

  const rows = await t.context.table.rows(`${rowKey}-*`)
  t.is(rows[0].key, `${rowKey}-a`)
  t.is(rows[0].Cell[0].column, `cf:foo`)
  t.is(rows[1].key, `${rowKey}-b`)
  t.is(rows[1].Cell[0].column, `cf:bar`)
})

test('Row.get()', async t => {
  const rowKey = randomName()
  const row = t.context.table.row(rowKey)

  await row.put([{ 'cf:foo': 'foo' }])

  const cell = await row.get('cf:foo')
  t.is(cell.column, 'cf:foo')
  t.is(cell.value, 'foo')
})

test('Row.deleteRow()', async t => {
  const rowKey = randomName()
  const row = t.context.table.row(rowKey)

  await row.put([{ 'cf:foo': 'foo' }])

  t.true(is.array(await t.context.table.rows(rowKey)))

  await row.deleteRow()

  const err = await t.throws(t.context.table.rows(rowKey))
  t.is(err.status, 404)
})

test('Row.delete()', async t => {
  const rowKey = randomName()
  const row = t.context.table.row(rowKey)

  await row.put([{ 'cf:foo': 'foo' }])

  const cell = await row.get('cf:foo')
  t.is(cell.column, 'cf:foo')

  await row.delete('cf:foo')

  const err = await t.throws(row.get('cf:foo'))
  t.is(err.status, 404)
})
