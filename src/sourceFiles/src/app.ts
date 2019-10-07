import { resolve } from 'path'

import { config } from 'dotenv'

config({ path: resolve(__dirname, '../.env') })
import express from 'express'
import compression from 'compression'  // compresses requests
import cors from 'cors'

import schema from './schema'
var flash = require('connect-flash')
var graphqlHTTP = require('express-graphql')

// Create Express server
const app = express()
/// Express configuration
app.set('port', process.env.PORT || 3000)
app.use(cors(
    // corsOptions
))


app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true,
}))

export default app
