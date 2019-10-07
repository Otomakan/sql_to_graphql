'use strict'
 function getType (col) {
  switch (col) {
      // Dates represented as strings
      case 'time':
      case 'date':
      case 'datetime':
      // pg
      case 'timestamp with time zone':

      // Buffers represented as strings
      case 'bit':
      case 'blob':
      case 'tinyblob':
      case 'longblob':
      case 'mediumblob':
      case 'binary':
      case 'varbinary':

      // Numbers that may exceed float precision, repesent as string
      case 'bigint':
      case 'bigint(20)':
      case 'decimal':
      case 'numeric':
      case 'geometry':
      case 'bigserial':

      // Network addresses represented as strings
      case 'cidr':
      case 'inet':
      case 'macaddr':

      // Strings
      case 'set':
      case 'char':
      case 'text':
      case 'uuid':
      case 'varchar':
      case 'nvarchar':
      case 'tinytext':
      case 'longtext':
      case 'character':
      case 'mediumtext':
      // pg
      case 'character varying':
      case 'jsonb':
          return 'string' 

      // Integers
      case 'int':
      case 'year':
      case 'serial':
      case 'integer':
      case 'tinyint':
      case 'smallint':
      case 'mediumint':
      case 'timestamp':
          return 'integer' 

      // Floats
      case 'real':
      case 'float':
      case 'double':
      case 'double precision':
          return 'float' 

      // Booleans
      case 'boolean':
          return 'boolean' 

      // Enum special case
      case 'enum':

      // As well as postgres enums
      case 'USER-DEFINED':
          return 'enum'
      default:
          throw new Error('Type "' + col.dataType + '" not recognized');
  }
}
 function sqlToGraphQlType (sqlType) {
   const type = getType(sqlType)
   switch (type){
    case 'integer':
      return 'GraphQLInt'
    case 'float':
      return 'GraphQLFloat'
    case 'string':
      return  'GraphQLString'
    case 'boolean':
      return 'GraphQLBool'
    case 'enum':
        return 'GraphQLString'
    default :
      return 'Shit error'
  }
}

module.exports = {
  sqlToGraphQlType,
  getType
}