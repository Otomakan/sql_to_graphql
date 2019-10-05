// const util = require('util')
const util = require('util')
const {parseCreateTable} = require('./tableParser')
const {convertTreeToQLObjectType} = require('./astToGraphqlStatement')
const mysql = require('mysql')
require('dotenv').config

const connection = mysql.createConnection({
  host : `${process.env.DB_HOST}`,
  user : `${process.env.DB_USER}`,
  password : `${process.env.DB_PASSWORD}`,
  database: `${process.env.DB_NAME}`
});





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
  'settings' text  NULL,
  PRIMARY KEY ('id'),
  KEY 'user_id' ('user_id'),
  KEY 'widget_type' ('widget_type'),
  CONSTRAINT 'user_widget_ibfk_1' FOREIGN KEY ('user_id') REFERENCES 'user' ('id') ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=401 DEFAULT CHARSET=latin1 COMMENT='Widget configuration for user' |
+-------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+`




const parsedTable = parseCreateTable(testQS)
console.log(util.inspect(parsedTable, false, null, true /* enable colors */))
// /convertTreeToQLObjectType(parsedTable)/convertTreeToQLObjectType(parsedTable)
const result = convertTreeToQLObjectType(parsedTable, 'mmp_generic')
console.log(result)
