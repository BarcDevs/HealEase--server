import config from 'config'
import express, { Express } from 'express'
import dotenv from 'dotenv'
import 'express-async-errors'
import { declareMiddlewares } from './middlewares'
import { declareRoutes } from './routes/declare_routes'
import { appConfig, serverConfig } from '../config'
import exposeProductionApp from './middlewares/exposeProductionApp'

dotenv.config()

const { port, host, protocol, url } = serverConfig
const { start } = appConfig

const app: Express = express()

declareMiddlewares(app)

declareRoutes(app)
exposeProductionApp(app)

app.listen(port, host, () => {
    const serverUrl = url
        .replace(/\{protocol}/g, protocol)
        .replace(/\{host}/g, host)
        .replace(/\{port}/g, port.toString())

    const message = `${start.replace(/\{0}/g, serverUrl)}`

    console.log(message)
})

export default app
