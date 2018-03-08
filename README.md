# hbase-rest

HBase REST client.

Feature:

- Namespace
  - [x] List
  - [x] Namespace info
  - [x] Create
  - [x] Update
  - [x] Delete
  - [x] Table list
- Table
  - [x] Table list
  - [x] Table schema
  - [x] Create
  - [x] Update
  - [x] Delete
  - [x] Region list
  - [x] Scanner
  - [ ] Scanner stream
- Row
  - [x] Row list
  - [x] Cell list
  - [x] Create
  - [x] Update
  - [x] Delete

## Usage

```js
import HBase from 'hbase-rest'
const client = new HBase('127.0.0.1') // new HBase('127.0.0.1:8080')
// equals
const client = new HBase({
  protocol: 'http:',
  host: '127.0.0.1',
  port: 8080,
  timeout: 0
})
```

### Cluster

#### Get cluster status

```js
const status = await client.status()
```

#### Get HBase version on current cluster

```js
const ver = await client.version()
```

### Namespace

#### List all namespaces

```js
const namespaces = await client.namespaces()
```

#### Create new namespace

```js
const ns = client.namespace('my_namespace')
await ns.create()
```

#### Get namespace information

```js
const ns = client.namespace('my_namespace')
const stat = await ns.stat()
```

#### Delete a namespace

```js
const ns = client.namespace('my_namespace')
await ns.delete()
```

#### List all tables of current namespace

```js
const tables = await ns.tables()
```

### Table

#### List all tables

```js
const tables = await client.tables()
```

#### Create new table

```js
const table = client.table('my_table')
await table.create({
  ColumnSchema: [{
    name: 'cf'
  }]
})

// Table with namespace
const table = client.table('my_table', { namespace: 'my_namespace' })
// or
const table = client.table({ tableName: 'my_table', namespace: 'my_namespace' })
```

#### Get table schema

```js
const table = client.table('my_table')
const stat = await table.stat()
```

#### Get table regions

```js
const regions = await table.regions()
```

#### Update table

```js
const table = client.table('my_table')
await table.create({
  ColumnSchema: [{
    name: 'cf'
  }]
})
await table.update({
  ColumnSchema: [{
    name: 'cf',
    KEEP_DELETED_CELLS: true
  }]
})
```

#### Delete a table

```js
const table = client.table('my_table')
await table.delete()
```

### Row

#### Get rows and cells of a table

```js
const rows = await table.rows()
/*
  returns
  [
    {
      key: 'row_key',
      Cell: [{
        column: 'column_name',
        timestamp: 1519980828873,
        value: 'column_value'
      }]
    }
  ]
 */
```

#### Write data to table

Single row:

```js
const row = table.row('my_row_key')

await row.put([
  {
    'cf:foo': 'foo'
  },
  {
    'cf:bar': 'bar'
  }
])

await row.get('cf:foo')
/*
  returns
  {
    column: 'column_name',
    timestamp: 1519980828873,
    value: 'column_value'
  }
 */
```

Multiple rows:

```js
await table.row().batchPut([
  {
    key: 'row_key',
    columns: [{ 'cf:foo: 'foo }]
  }
])
```

#### Get data from a row

```js
await row.get('cf:foo')
/*
  returns
  {
    column: 'column_name',
    timestamp: 1519980828873,
    value: 'column_value'
  }
 */
```

#### Delete row

```js
await row.deleteRow()
```

#### Delete a column

```js
await row.delete()
```

### Scan table

```js
const rows = await table.scan({
  batch: 10,
  startRow: '',
  endRow: '',
  filter: {
    qualifier: 'foo',
    family: 'cf',
    op: 'EQUAL',
    type: 'SingleColumnValueFilter',
    comparator: {
      value: 1,
      type: 'BinaryComparator'
    }
  }
})
/*
  returns
  [
    {
      "key": "foo",
      "Cell": [
        {
          "column": "cf:foo",
          "timestamp": 1520179183114,
          "value": "1"
        }
      ]
    }
  ]
 */
```

`FilterList`:

```js
await table.scan({
  filter: {
    type: 'FilterList',
    op: 'MUST_PASS_ALL',
    filters: [
      {
        type: 'RowFilter',
        op: 'EQUAL',
        comparator: {
          value: 'foo',
          type: 'BinaryComparator'
        }
      },
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
      }
    ]
  }
})
```
