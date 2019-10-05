const shave = require('./utils').shave

const checkConstraints = (columnDefinition) => {
  const constraints = {
    isNull:true,
    unique: false,
    primaryKey: false,
    foreignKey: false, 
    check: null,
    default:''
  }
  
  if(columnDefinition.includes('NULL') ) {
    const indexOfNull = columnDefinition.indexOf('NULL')
    if (columnDefinition[indexOfNull-1] === 'NOT') {
      constraints.isNull = false
    }
  }

  if (columnDefinition.indexOf('FOREIGN') ) {
    let foreignIndex = columnDefinition.indexOf('FOREIGN')
    if(columnDefinition[foreignIndex+1] === 'KEY') {
      let foreignKey = shave(columnDefinition[foreignIndex+2], 2)
      constraints.foreignKey = foreignKey
    } 
  }

  return constraints
} 

const interpretConstraintStatement =  (statement, ast) => {
  const constraints = {
    isNull:true,
    unique: false,
    primaryKey: false,
    foreignKey: false, 
    check: null,
    default:''
  }
  // newEntry.name =  statement[1].substr(1, statement[1].length-2)
  if (statement.indexOf('FOREIGN') ) {
    let foreignIndex = statement.indexOf('FOREIGN')
    if(statement[foreignIndex+1] === 'KEY') {
      const columnName = shave(statement[foreignIndex+2])
      const referenceIndex = statement.indexOf('REFERENCES')
      const referencedTable  = shave(statement[referenceIndex+1])
      const referencedColumn = shave(statement[referenceIndex+2])
      // constraints
        ast.columns[columnName].constraints.foreignKey = {
        referencedColumn,
        referencedTable
      }
    } 
  }
  // final.constraints.push(newEntry)
  return ast
}
const parseCreateTable = (queryString) => {
  // const match =  queryString.match(/CREATE TABLE\s\'([a-z\-\_]+)[\s\S]*?\(([\s\S]*)?\n\)([\s\S]*?)\|/m)
  try{
  const match =  queryString.match(/CREATE TABLE\s\`([a-z\-\_]+)[\s\S]*?\(([\s\S]*)?\n\)/m)
  let rawTableDescription = match[2]
  const tableName = match[1]
  let allRowsRawDescriptions = []
  let currentSentence = ''

  const finalAST = {
    keys : [],
    primarykey: {},
    constraints:[],
    columns: {},
    tableName
  }

  for (var i = 0; i < rawTableDescription.length; i++) {
    let currentChar = rawTableDescription.charAt(i)
    if(currentChar==',' ){ 
      if( rawTableDescription[i+1].match(/\n|\r/)){
      allRowsRawDescriptions.push(breakUpSentence(currentSentence, finalAST))
      currentSentence = ''
      }
    }
    else if (i === rawTableDescription.length -1){
      allRowsRawDescriptions.push(breakUpSentence(currentSentence, finalAST))
      currentSentence = ''
    }
    else {
      currentSentence += currentChar
    }
  }
  return finalAST
}
  catch(e) {
    console.log('failed qs: ')
    throw e
  }
}

const breakUpSentence = (rawSentence, final) => {

  const match =  rawSentence.match(/(\S+)/g)
   //  match.shift()
   // final.components = match
   let newEntry  = {
    rawStatements :[]
   }
   if( match[0][0] === '\`') {
     const columnName = shave(match[0])
     newEntry.type =  match[1]
     newEntry.rawStatements.push(rawSentence)
     newEntry.constraints = checkConstraints(match)
     if(match[2] === 'NULL') {
       newEntry.isNull = true
     }
     else {
       newEntry.isNull = false
     }
     if(columnName == 'user_id`'){
       console.log("USER ID FAIL")
      console.log(rawSentence)
      console.log(match)
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
     interpretConstraintStatement(match, final)
   }
  return final
 }

 
module.exports = {
  parseCreateTable
}