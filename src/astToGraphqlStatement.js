const sqlToGraphQlType = require('./columnToObjects').sqlToGraphQlType
const snakeToCamel = require('./utils').snakeToCamel
const foreignKeyString = (columnName, referencedTable, referencedColumn, dbName) => {
  
 
    // const {referencedColumn, referencedTable} = description.constraints.foreignKey
    const camelColumnName = snakeToCamel(columnName)
    const fieldName = snakeToCamel(referencedTable) + 's'
    
    fieldType = `GraphQLList(${referencedTable}Type)`

    const arguments = `
          size : {
              type: GraphQLInt,
              description: 'limits the number of ${fieldName} you can see'
          },
    `

    const resolveFunction = `async function ({${camelColumnName}}, {size=0}) {
      try{
          let queryString = ('SELECT * FROM ${dbName}.${referencedTable} WHERE ${referencedColumn}=' + ${camelColumnName} + ')' )
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
  // const tree
  const allColumnsName = Object.keys(tree.columns)
  const camelTableName = snakeToCamel(tree.tableName)
  //We store this for the imports at the top of the file
  const allTypesUsed = []
  const foreignTypes = []
  let importPool = false

  let finalString = `
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
    `
  allColumnsName.forEach((columnName, i) => {
    const description = tree.columns[columnName]
    const fieldName = snakeToCamel(columnName)
    fieldType = sqlToGraphQlType(description.type.match(/[a-zA-Z]+/)[0])
    if (!allTypesUsed.includes(fieldType)) {
      allTypesUsed.push(fieldType)
    }
    finalString += `
      ${fieldName}: {
        type: ${fieldType} 
      },
    `
    
      // If there is a foreign key, allow to get that foreign key
      if (description.constraints.foreignKey) {
        const {referencedColumn, referencedTable } =  description.constraints.foreignKey
        importPool = true
        if (!allTypesUsed.includes('GraphQLList')) {
          allTypesUsed.push('GraphQLList')
        }
        finalString += foreignKeyString(fieldName, referencedTable, referencedColumn, dbName)
        foreignTypes.push(`import { ${referencedTable}Type } from './${referencedTable}'`)

      }


  })
  
    
    finalString += ` })
  })
  
  export default ${camelTableName}Type`
  let allImports = ''
  let allGraphQLImports = 'import { GraphQLObjectType,'

  allTypesUsed.forEach((type,i)=>{
    allGraphQLImports += type 
    if(i<allTypesUsed.length-1){
      allGraphQLImports += ','
    }
    allGraphQLImports += ' '
  })

  allGraphQLImports+= `} from 'graphql'

  `


   allImports += allGraphQLImports
  foreignTypes.forEach(importStatement=>{
    allImports += `${importStatement}
    `
  })
  if(importPool){
    allImports += `
    import pool from '../db/pool'
`
  }

  return allImports + finalString
}

module.exports = {
  convertTreeToQLObjectType
}