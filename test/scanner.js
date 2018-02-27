import test from 'ava'

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

  const rows = []

  for (let i = 0; i < 3; i++) {
    rows.push({
      key: `foo-${i}`,
      columns: [{ 'cf:foo': i }]
    })
  }

  await t.context.table.row().batchPut(rows)
})

test.afterEach(async t => {
  await t.context.table.delete()
})

test('Scan', async t => {
  const table = t.context.table

  const result = await table.scan({
    filter: {
      type: 'FilterList',
      op: 'MUST_PASS_ALL',
      filters: [
        {
          type: 'FamilyFilter',
          op: 'EQUAL',
          comparator: {
            value: 'cf',
            type: 'BinaryComparator'
          }
        },
        {
          type: 'QualifierFilter',
          op: 'EQUAL',
          comparator: {
            value: 'foo',
            type: 'BinaryComparator'
          }
        },
        {
          type: 'RowFilter',
          op: 'EQUAL',
          comparator: {
            value: 'foo-1',
            type: 'BinaryComparator'
          }
        }
      ]
    }
  })

  t.is(result.length, 1)
  t.is(result[0].key, 'foo-1')
  t.is(result[0].Cell[0].column, 'cf:foo')
})
