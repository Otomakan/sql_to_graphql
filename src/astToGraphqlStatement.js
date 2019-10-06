const sqlToGraphQlType = require('./columnToObjects').sqlToGraphQlType
const {snakeToCamel, capitalize} = require('./utils')
const buildRootSchema = require('./buildRootSchema')

const getAllReferencer = (columnName, referencedBy, dbName) => {
  const camelColumnName = snakeToCamel(columnName)
  const referencererTable = referencedBy.table
  const referencerColumn = referencedBy.column
  let fieldName
  if(referencererTable.substr(referencererTable.length-2, referencererTable.length) == "Id"){
     fieldName = 'getAll'+ capitalize(snakeToCamel(referencererTable.substr(0, referencererTable.length-2))) + 'By' + capitalize(snakeToCamel(referencerColumn)) + 's'
  }
  else {
     fieldName = 'getAll'+ capitalize(snakeToCamel(referencererTable))  + 'By' + capitalize(snakeToCamel(referencerColumn)) + 's'
  }

  let type = `GraphQLList(${snakeToCamel(referencererTable)}Type)`
  let args = `
            size : {
              type: GraphQLInt,
            description: 'limits the number of groups you can see'
},`

let resolveFunction = `async function ({id}, {size=0}) {
            try{
                let queryString = 'SELECT * FROM ${dbName}.${referencererTable} WHERE ${referencerColumn}=' + id
                if (size != 0) {
                    queryString += 'LIMIT ' + size
                }
                const res: any= await pool.query(queryString + ';')
                const groups: any= []
                res.forEach((group: any)=> {
                    Object.keys(group).forEach((key)=> group[snakeToCamel(key)] = group[key]) 
                    groups.push(group)
                })
                return groups
            }
            catch(e){
                console.log(e)
            }
          }`
  return `
      ${fieldName} : {
        type : ${type},
          args :{${args}},
          resolve: ${resolveFunction},
      },
`
}

const foreignKeyString = (columnName, referencedTable, referencedColumn, dbName) => {
    const camelColumnName = snakeToCamel(columnName)
    let fieldName
    if(camelColumnName.substr(camelColumnName.length-2, camelColumnName.length) == "Id"){
       fieldName = 'get'+ capitalize(snakeToCamel(camelColumnName.substr(0, camelColumnName.length-2))) + 's'
    }
    else {
       fieldName = 'get'+ capitalize(snakeToCamel(camelColumnName)) + 's'
    }
    fieldType = `GraphQLList(${snakeToCamel(referencedTable)}Type)`

    const arguments = `
          size : {
              type: GraphQLInt,
              description: 'limits the number of ${fieldName} you can see'
          },
    `

    const resolveFunction = `async function ({${camelColumnName}}, {size=0}) {
      try{
          let queryString = 'SELECT * FROM ${dbName}.${referencedTable} WHERE ${referencedColumn}=' + ${camelColumnName} 
          if (size != 0) {
              queryString += 'LIMIT' + size
          }
          const res: any= await pool.query(queryString + ';')
          const ${referencedTable}: any= []
          res.forEach((group: any)=> {
              Object.keys(group).forEach((key)=> group[snakeToCamel(key)] = group[key]) 
              ${referencedTable}.push(group)
          })
          return ${referencedTable}
      }
      catch(e){
          console.log(e)
      }
    }
    `
    return  `
      ${fieldName}: {
        type :  ${fieldType},
        args : {
          ${arguments}
        },
        resolve : ${resolveFunction}
      },
    `
}
const convertTreeToQLObjectType = (tree, dbName) => {
  try{
  // const tree
  const allColumnsName = Object.keys(tree.columns)
  const tableName = tree.tableName
  const camelTableName = snakeToCamel(tree.tableName)
  //We store this for the imports at the top of the file
  const allBasicGraphqlTypes = []
  const allTypesUsed = [camelTableName]
  let importPool = false


  let finalString = ''
  // Add all the fields to final String
  allColumnsName.forEach((columnName, i) => {
    const description = tree.columns[columnName]
    const fieldName = snakeToCamel(columnName)
    const { referencedBy } =  description

    fieldType = sqlToGraphQlType(description.type.match(/[a-zA-Z0-9]+/)[0])
    if (!allBasicGraphqlTypes.includes(fieldType) && fieldType != 'GraphQLInt') {
      allBasicGraphqlTypes.push(fieldType)
    }
    finalString += `
      ${fieldName}: {
        type: ${fieldType} 
      },
    `
    if(referencedBy.length > 0) {
        console.log(description)
      referencedBy.forEach(refererObject=>{
        finalString += getAllReferencer(columnName, refererObject, dbName)
        if (!allTypesUsed.includes(snakeToCamel(refererObject.table))) {
          allTypesUsed.push(snakeToCamel(refererObject.table) )
        }
        if(!allBasicGraphqlTypes.includes('GraphQLList')){
          allBasicGraphqlTypes.push('GraphQLList')
        }

      })
    }
      // If there is a foreign key, allow to get that foreign key
    if (description.constraints.foreignKey) {
      const {referencedColumn, referencedTable } =  description.constraints.foreignKey



      importPool = true
      if (!allBasicGraphqlTypes.includes('GraphQLList')) {
        allBasicGraphqlTypes.push('GraphQLList')
      }

      finalString += foreignKeyString(fieldName, referencedTable, referencedColumn, dbName)
    
      
      if (!allTypesUsed.includes(snakeToCamel(referencedTable))) {
        allTypesUsed.push(snakeToCamel(referencedTable) )
      }
      

    }


  })
  
  finalString = `
const snakeToCamel = (str: string) => str.replace(
/([-_][a-z])/g,
(group: string) => group.toUpperCase()
    .replace('-', '')
    .replace('_', '')
)
export const ${camelTableName}Type = new GraphQLObjectType ({
name: '${camelTableName}',
description: 'a single ${camelTableName}',
fields: ()=> ({
    ` + finalString


    
  
    
    finalString += ` })
  })`

// Creating the GraphField Config object

finalString += `
export const ${capitalize(camelTableName)}: GraphQLFieldConfig = {
    type: ${camelTableName}Type,
    description: '${camelTableName}',
    args : {
        id : {
            type: GraphQLInt,
        }
    },
    resolve: async (_, {id}) => {
        try {
            console.log(id)
            let queryString = ('SELECT * FROM ${dbName}.${tableName} WHERE id=' + id)
            console.log(queryString)
            const res: any= await pool.query(queryString + ';')
            console.log(res)
            const ${camelTableName}s: any= []
            res.forEach((${camelTableName}: any)=> {
                Object.keys(${camelTableName}).forEach((key)=> ${camelTableName}[snakeToCamel(key)] = ${camelTableName}[key]) 
                ${camelTableName}s.push(${camelTableName})
            })
            return  ${camelTableName}s[0]
        }
        catch(e){
            console.log(e)
        }
    }
}
`

  finalString+=`
export default ${camelTableName}Type
`

  let allImports = ''
  let allGraphQLImports = 'import { GraphQLObjectType, GraphQLFieldConfig, GraphQLInt, '

  
  allBasicGraphqlTypes.forEach((type,i)=>{
    allGraphQLImports += type 
    if(i<allBasicGraphqlTypes.length-1){
      allGraphQLImports += ','
    }
    allGraphQLImports += ' '
  })

  allGraphQLImports+= `} from 'graphql'

  `


   allImports += allGraphQLImports
  //  The first type used is the current type so we delete it
   allTypesUsed.shift()
   allTypesUsed.forEach(type=>{
    allImports += `import { ${snakeToCamel(type)}Type } from './${snakeToCamel(type)}'
    `

  })
  if(importPool){
    allImports += `
    import pool from '../db/pool'
`
  }

  return allImports + finalString

  }
  catch(e){
    // console.log(tree)
    console.log(e)
    throw e
  }
}


module.exports = {
  convertTreeToQLObjectType,
  buildRootSchema
}