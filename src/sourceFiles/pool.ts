import mysql from 'mysql'
import util from 'util'

// const create
// class pool
console.log(process.env.DB_NAME)
const pool = mysql.createPool({
    host : `${process.env.DB_HOST}`,
    user : `${process.env.DB_USER}`,
    password : `${process.env.DB_PASSWORD}`,
    database: `${process.env.DB_NAME}`
});

pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
        console.error('error connecting')
        console.log(err)
        console.log( `${process.env.DB_USER}`)
    }
    if (connection) connection.release()
    return
})

pool.on('acquire', function (connection) {
    console.log('Connection %d acquired', connection.threadId);
})

pool.query = util.promisify(pool.query)

export default pool