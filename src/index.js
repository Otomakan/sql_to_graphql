// const util = require('util')
const util = require('util')
const {parseCreateTable} = require('./tableParser')
const {convertTreeToQLObjectType, buildRootSchema} = require('./astToGraphqlStatement')
const mysql = require('mysql')
const fs = require('fs')
require('dotenv').config()

const pool = mysql.createPool({
  host : `${process.env.DB_HOST}`,
  user : `${process.env.DB_USER}`,
  password : `${process.env.DB_PASSWORD}`,
  database: `${process.env.DB_NAME}`
});


const allTables = []
pool.query = util.promisify(pool.query)


async function main(){

try {
  const allTableTrees = []
  if (!fs.existsSync(__dirname + `/../dist/graphql`)){
    fs.mkdirSync(__dirname + `/../dist/graphql`)
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
      allTableTrees.push(parsedTable)
      // console.log('parsedTable')
      // console.log(parsedTable)
      const result = convertTreeToQLObjectType(parsedTable, process.env.DB_NAME)
      // console.log(result)
      fs.writeFile(__dirname + `/../dist/graphql/${tableName}.ts`, result, function (err) {
        resolve()

        if (err) {
          throw err
        }
        console.log("It's saved!")  
      })
    })
  })
  

  if (!fs.existsSync(__dirname + `/../dist/db`)){
    fs.mkdirSync(__dirname + `/../dist/db`)
  }
  fs.writeFile(__dirname + `/../dist/app.ts`, fs.readFileSync(__dirname +'/sourceFiles/app.ts'), ()=>{
    console.log('written')
  })
  fs.writeFile(__dirname + `/../dist/server.ts`, fs.readFileSync(__dirname +'/sourceFiles/app.ts'), ()=>{
    console.log('written')
  })
  
  fs.writeFile(__dirname + `/../dist/db/pool.ts`, fs.readFileSync(__dirname +'/sourceFiles/pool.ts'), ()=>{
    console.log('written')
  })

  Promise.all(tableRequests).then(() => {
    let schemaString = buildRootSchema(allTableTrees)
    fs.writeFile(__dirname + `/../dist/schema.ts`, schemaString, ()=>{
      console.log('written')
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


// const testQS  = `
// +-------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
// | Table       | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
// +-------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
// | user_widget | CREATE TABLE 'user_widget' (
//   'id' bigint(20) NOT NULL AUTO_INCREMENT,
//   'user_id' bigint(20) NOT NULL,
//   'xpos' int(2) NOT NULL,
//   'ypos' int(2) NOT NULL,
//   'widget_type' varchar(50) NOT NULL,
//   'settings' text  NULL,
//   PRIMARY KEY ('id'),
//   KEY 'user_id' ('user_id'),
//   KEY 'widget_type' ('widget_type'),
//   CONSTRAINT 'user_widget_ibfk_1' FOREIGN KEY ('user_id') REFERENCES 'user' ('id') ON DELETE CASCADE ON UPDATE CASCADE
// ) ENGINE=InnoDB AUTO_INCREMENT=401 DEFAULT CHARSET=latin1 COMMENT='Widget configuration for user' |
// +-------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+`




// const parsedTable = parseCreateTable(testQS)
// console.log(util.inspect(parsedTable, false, null, true /* enable colors */))
// // /convertTreeToQLObjectType(parsedTable)/convertTreeToQLObjectType(parsedTable)
// const result = convertTreeToQLObjectType(parsedTable, 'mmp_generic')
// console.log(result)
}

main = util.promisify(main)
 main().then(()=>{
   console.log('dne')
  pool.end()

})