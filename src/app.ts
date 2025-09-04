import dotenv from 'dotenv'
import express, { type Express } from 'express'
import 'express-async-errors'
import { declareMiddlewares } from './middlewares'
import { appConfig, serverConfig } from '../config'
import exposeProductionApp from './middlewares/exposeProductionApp'
import { declareRoutes } from './routes/declare_routes'

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
