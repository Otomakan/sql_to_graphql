const sqlToGraphQlType = require('./columnToObjects').sqlToGraphQlType
const util = require('util')
const snakeToCamel = (str) => str.replace(
  /([-_][a-z])/g,
  (group) => group.toUpperCase()
                  .replace('-', '')
                  .replace('_', '')
);


const strip = (string, iterations) => {
  iterations = iterations || 1
  if(iterations > 1){
    iterations -= 1
    return strip(string.substr(1, string.length-2),  iterations)
  }
  return string.substr(1, string.length-2)

}

const checkConstraints = (columnDefinition) => {
  const constraints = {
    isNull,
    unique,
    primaryKey,
    foreignKey, 
    check,
    default:''
  }
  if(columnDefinition.includes('NULL') ) {
    const indexOfNull = columnDefinition.indexOf('NULL')
    if (columnDefinition[indexOfNull] === 'NOT') {
      constraints.isNull = true
    }
  }
  if (match.indexOf('FOREIGN') ) {
    let foreignIndex = match.indexOf('FOREIGN')
    if(match[foreignIndex+1] === 'KEY'){
      let foreignKey = strip(match[foreignIndex+2],2)
      console.log(foreignKey)
    } 
  }

  return constraints
}
const breakUpSentence = (rawSentence, final) => {

 const match =  rawSentence.match(/(\S+)/g)
  //  match.shift()
  // final.components = match
  let newEntry  = {
  //   raw : rawSentence,
  //   destructured: match
  rawStatements :[]
  }
  if( match[0][0] === '\'') {
    const columnName = strip(match[0].substr(0, match[0].length), 1)
    newEntry.type =  match[1]
    newEntry.rawStatements.push(rawSentence)
    checkConstraints(match)
    if(match[2] === 'NULL') {
      newEntry.isNull = true
    }
    else {
      newEntry.isNull = false
    }
    
    final.columns[columnName] = newEntry
  }
  else if (match[0] == 'KEY') {
    newEntry.name = match[0].substr(0, match[0].length)
    
    final.keys.push(newEntry)
  }
  else if (match[0] == 'PRIMARY') {
    // Something is weird here
    newEntry.name = match[2].substr(2, match[2].length-3)
    final.primaryKey = newEntry
  }
  else if (match[0] == 'CONSTRAINT') {
    console.log('constaint name')
    console.log( match[1].substr(1, match[1].length-2))
    newEntry.name =  match[1].substr(1, match[1].length-2)
    if (match.indexOf('FOREIGN') ) {
      let foreignIndex = match.indexOf('FOREIGN')
      if(match[foreignIndex+1] === 'KEY'){
        let foreignKey = strip(match[foreignIndex+2],2)
        console.log(foreignKey)
      } 
    }
    console.log(newEntry)
    final.constraints.push(newEntry)
  }
 return final
}



const parseCreateTable = (queryString) =>{
  const match =  queryString.match(/CREATE TABLE\s\'([a-z\-\_]+)[\s\S]*?\(([\s\S]*)?\n\)([\s\S]*?)\|/m)
  let rawTableDescription = match[2]
  let allRowsRawDescriptions = []
  let currentSentence = ''
  const finalAST = {
    keys : [],
    primarykey: {},
    constraints:[],
    columns: {}
  }
  for (var i = 0; i < rawTableDescription.length; i++) {
    let currentChar = rawTableDescription.charAt(i)
    if(currentChar==',' || i === rawTableDescription.length -1){
      allRowsRawDescriptions.push(breakUpSentence(currentSentence, finalAST))
      currentSentence = ''
    }
    else {
      currentSentence += currentChar
    }
  }
  return finalAST
}
const testQS  = `
+-------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table       | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
+-------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| user_widget | CREATE TABLE 'user_widget' (
  'id' bigint(20) NOT NULL AUTO_INCREMENT,
  'user_id' bigint(20) NOT NULL,
  'xpos' int(2) NOT NULL,
  'ypos' int(2) NOT NULL,
  'widget_type' varchar(50) NOT NULL,
  'settings' text NOT NULL,
  PRIMARY KEY ('id'),
  KEY 'user_id' ('user_id'),
  KEY 'widget_type' ('widget_type'),
  CONSTRAINT 'user_widget_ibfk_1' FOREIGN KEY ('user_id') REFERENCES 'user' ('id') ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=401 DEFAULT CHARSET=latin1 COMMENT='Widget configuration for user' |
+-------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+`



const convertTreeToQLObjectType = (tree) => {
  const camelTableName = snakeToCamel(tree.tableName)
  const allRowsDescriptions = tree.allRowsDescriptions
  const allTypesUsed = []
  let finalString = `export const ${camelTableName}Type = new GraphQLObjectType ({
      name: '${camelTableName.charAt(0).toUppercase}',
      description: 'a single ${camelTableName}',
      fields: ()=> ({
    `
  allRowsDescriptions.forEach((description, i) => {
    if(description.type == 'column') {
      columnName = description.components[0]

      columnType = sqlToGraphQlType(description.components[1].match(/[a-zA-Z]+/)[0])
      if (allTypesUsed.includes(columnType)) {
        allTypesUsed.push(columnType)
      }
      finalString += `
        ${columnName}: {
          type: ${columnType} 
        }
      `
    }
    if (description.type == 'key') {
      const key = description.components[1]
      //Check if the key 
      if (key.substr(key.length-4) == '_id\'') {
        const fieldName = key.substr(1, key.length-5)


      }
    }
  })
  
    
    finalString += ` })
  })

  
  
  
  export default ${camelTableName}Type`
  
  return finalString
}

const parsedTable = parseCreateTable(testQS)
console.log(util.inspect(parsedTable, false, null, true /* enable colors */))
// /convertTreeToQLObjectType(parsedTable)/convertTreeToQLObjectType(parsedTable)
// convertTreeToQLObjectType(parsedTable)
