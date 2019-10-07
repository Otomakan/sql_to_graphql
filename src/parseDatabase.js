const {parseCreateTable, addReferencedBy} = require('./tableParser')

const parseDatabase = async (dbName, pool) => {
  const allTables = []

  const dataBaseTree = {
    name: dbName,
    tables:{},
    
  }
  const res  = await pool.query('show tables')
  res.forEach(element => {
    allTables.push(Object.values(element)[0])
  })
  const tableRequests = allTables.map(async tableName => {
    const createTableResponse = await  pool.query(`show create table ${process.env.DB_NAME}.${tableName}`)
    const tableDescription = createTableResponse[0]['Create Table']
    const parsedTable = parseCreateTable(tableDescription)
    dataBaseTree.tables[tableName] = parsedTable
    }
  )
  return Promise.all(tableRequests)
    .then(() => {
      dataBaseTree.tables = addReferencedBy(dataBaseTree.tables)
      return dataBaseTree

    }).catch(e=> {throw e})

}

module.exports = parseDatabase