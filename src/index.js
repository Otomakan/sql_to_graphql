// const util = require('util')
const util = require('util')
const {convertTreeToQLObjectType, buildRootSchema} = require('./astToGraphqlStatement')
const mysql = require('mysql')
const fs = require('fs')
const parseDataBase = require('./parseDatabase')
const  {snakeToCamel} = require('./utils')
const writeSourceFiles = require('./writeSourceFiles')
require('dotenv').config()

const pool = mysql.createPool({
  host : `${process.env.DB_HOST}`,
  user : `${process.env.DB_USER}`,
  password : `${process.env.DB_PASSWORD}`,
  database: `${process.env.DB_NAME}`
});


pool.query = util.promisify(pool.query)


async function main(destinationDirectory) {

  try {
    writeSourceFiles(__dirname +'/sourceFiles', destinationDirectory)

    const dataBaseTree = await parseDataBase(process.env.DB_NAME, pool)

    let schemaString = buildRootSchema(Object.values(dataBaseTree.tables))
    fs.writeFile(destinationDirectory + `/src/schema.ts`, schemaString, (e) => {
      if(e){
        console.log('error with schema')
        throw e
      }
    })
    // console.log(util.inspect(dataBaseTree, false, null, true /* enable colors */))
      
    Object.keys(dataBaseTree.tables).forEach(tableName => {
      const parsedTable = dataBaseTree.tables[tableName]
      const result = convertTreeToQLObjectType(parsedTable, process.env.DB_NAME)
      fs.writeFile(destinationDirectory + `/src/graphql/${snakeToCamel(tableName)}.ts`, result, function (err) {
        if (err) {
          throw err
        }
      })
    })
      
      pool.end()
    // })
    // .catch((e)=>{throw e})
  }

  catch(e){
    throw e
  }

}

main = util.promisify(main)
 main(__dirname + '/../../generatedAPI').then(()=>{
   console.log('TADA!')
  pool.end()

})

// console.log(writeSourceFiles(__dirname +'/sourceFiles', destinationDirectory))