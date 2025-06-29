import path from 'path'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import express, { Express } from 'express'

import helmet from 'helmet'
import hpp from 'hpp'
import morgan from 'morgan'
import { loggerMiddleware } from './loggerMiddleWare'
import { rateLimiter } from './rate-limiting'
import { sanitizeData } from './sanitaization'
import { serverConfig } from '../../config'

export const declareMiddlewares = (app: Express) => {
    // Middlewares
    app.use(cookieParser())
    app.use(helmet())
    app.use(compression())
    app.use(
        cors({
            credentials: true,
            origin: [serverConfig.origin]
        })
    )
    app.use(morgan('dev'))
    app.use(express.json())
    app.use(express.urlencoded({ extended: false }))
    app.use(express.static(path.join(__dirname, 'public')))

    app.use(sanitizeData) // sanitize data from request body
    app.use(hpp()) // http params pollution prevention
    app.use(rateLimiter) // rate limiting for api requests

    app.use(loggerMiddleware) // logger middleware for log the errors and warnings to logger files

    return app
}
