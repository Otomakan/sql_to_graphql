
const buildRootSchema = (ast) => {
  
  let finalString = `
import {  GraphQLSchema, GraphQLObjectType, GraphQLInt, GraphQLString, GraphQLEnum} from 'graphql'
import pool from '../db/pool'

const snakeToCamel = (str: string) => str.replace(
    /([-_][a-z])/g,
    (group: string) => group.toUpperCase()
        .replace('-', '')
        .replace('_', '')
)

const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
  `
  let allImports = []

  ast.forEach(tree => {
    allImports.push(`
import { ${capitalize(snakeToCamel(tree.tableName))} } from './graphql/${snakeToCamel(tree.tableName)}'
`)

    finalString += `
      ${snakeToCamel(tree.tableName)} : ${capitalize(snakeToCamel(tree.tableName))},`
  })
  finalString += `
  }
})

export default new GraphQLSchema({query: queryType});`
console.log(allImports)
  allImportsString = ''
  allImports.forEach(importStatement => {
    // console.log(importStatement)
    allImportsString += importStatement
  })
  console.log(allImportsString+ finalString)
  return  allImportsString+ finalString
}
module.exports = buildRootSchema