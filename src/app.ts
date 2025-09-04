import dotenv from 'dotenv'
import express, { type Express } from 'express'
import 'express-async-errors'
import { declareMiddlewares } from './middlewares'
import { appConfig, serverConfig } from '../config'
import exposeProductionApp from './middlewares/exposeProductionApp'
import { declareRoutes } from './routes/declare_routes'

dotenv.config()

const {
    host,
    protocol,
    url
} = serverConfig
const { start } = appConfig

const port =
    // add env port import for render deployment
    process.env.PORT ?
        Number(process.env.PORT) :
        serverConfig.port

const app: Express = express()

declareMiddlewares(app)

declareRoutes(app)
exposeProductionApp(app)

app.listen(port || 3000, host, () => {
    const serverUrl = url
        .replace(/\{protocol}/g, protocol)
        .replace(/\{host}/g, host)
        .replace(/\{port}/g, port.toString())

    const message = `${start.replace(/\{0}/g, serverUrl)}`

    console.log(message)
})

export default app
