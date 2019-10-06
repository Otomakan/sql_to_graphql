// const util = require('util')
const util = require('util')
const {parseCreateTable, addReferenced} = require('./tableParser')
const {convertTreeToQLObjectType, buildRootSchema} = require('./astToGraphqlStatement')
const mysql = require('mysql')
const fs = require('fs')
const  {snakeToCamel} = require('./utils')
require('dotenv').config()

const pool = mysql.createPool({
  host : `${process.env.DB_HOST}`,
  user : `${process.env.DB_USER}`,
  password : `${process.env.DB_PASSWORD}`,
  database: `${process.env.DB_NAME}`
});


const allTables = []
pool.query = util.promisify(pool.query)


async function main(destinationFile){

try {
  const allTablesTree = {tables:{},}
  if (!fs.existsSync(destinationFile + ``)){
    fs.mkdirSync(destinationFile + ``)
  }
  if (!fs.existsSync(destinationFile + `/src`)){
    fs.mkdirSync(destinationFile + `/src`)
  }
  if (!fs.existsSync(destinationFile + `/src/graphql`)){
    fs.mkdirSync(destinationFile + `/src/graphql`)
  }
  const res  = await pool.query('show tables')
  res.forEach(element => {
    allTables.push(Object.values(element)[0])
  })

  const tableRequests = allTables.map(async tableName=>{
  //  const tableName = allTables[0]
    return new Promise( async(resolve) => {
      const createTableResponse = await  pool.query(`show create table ${process.env.DB_NAME}.${tableName}`)
      const tableDescription = createTableResponse[0]['Create Table']
      // console.log(tableDescription)
      const parsedTable = parseCreateTable(tableDescription)
      allTablesTree.tables[tableName] = parsedTable
      // console.log('parsedTable')
      // console.log(parsedTable)
      resolve()
    })
  })
  

  if (!fs.existsSync(destinationFile + `/src/db`)){
    fs.mkdirSync(destinationFile + `/src/db`)
  }
  fs.writeFile(destinationFile + `/src/app.ts`, fs.readFileSync(__dirname +'/sourceFiles/app.ts'), ()=>{
    console.log('written')
  })
  fs.writeFile(destinationFile + `/src/server.ts`, fs.readFileSync(__dirname +'/sourceFiles/server.ts'), ()=>{
    console.log('written')
  })
  
  fs.writeFile(destinationFile + `/src/db/pool.ts`, fs.readFileSync(__dirname +'/sourceFiles/pool.ts'), ()=>{
    console.log('written')
  })
  fs.writeFile(destinationFile + `/package.json`, fs.readFileSync(__dirname +'/sourceFiles/package.json'), ()=>{
    console.log('written')
  })
  fs.writeFile(destinationFile + `/tsconfig.json`, fs.readFileSync(__dirname +'/sourceFiles/tsconfig.json'), ()=>{
    console.log('written')
  })
  const dotenvData = `
    DB_HOST=${process.env.DB_HOST}
    DB_USER=${process.env.DB_USER}
    DB_PASSWORD=${process.env.DB_PASSWORD}
    DB_NAME=${process.env.DB_NAME}
  `
  fs.writeFile(destinationFile + `/.env`, dotenvData, ()=>{
    console.log('written')
  })

  Promise.all(tableRequests).then(() => {
    let schemaString = buildRootSchema(Object.values(allTablesTree.tables))
    fs.writeFile(destinationFile + `/src/schema.ts`, schemaString, ()=>{
      console.log('written')
    })
    allTablesTree.tables = addReferenced(allTablesTree.tables)
    
    Object.keys(allTablesTree.tables).forEach(tableName => {
      if(tableName == 'user'){
        console.log(allTablesTree.tables[tableName].columns.id)
      }
      const parsedTable = allTablesTree.tables[tableName]
      const result = convertTreeToQLObjectType(parsedTable, process.env.DB_NAME, allTables)
      fs.writeFile(destinationFile + `/src/graphql/${snakeToCamel(tableName)}.ts`, result, function (err) {

        if (err) {
          throw err
        }
        console.log("It's saved!")  
      })
    })
    
    pool.end()
  })
  .catch((e)=>{console.log(e)})
}
catch(e){
  pool.end()

  throw e
  // console.log('blo')
}

}

main = util.promisify(main)
 main(__dirname + '/../../generatedApi').then(()=>{
   console.log('dne')
  pool.end()

})