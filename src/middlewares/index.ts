import helmet from 'helmet'
import compression from 'compression'
import cors from 'cors'
import morgan from 'morgan'
import hpp from 'hpp'
import express, { Express } from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import { loggerMiddleware } from './loggerMiddleWare'
import { sanitizeData } from './sanitaization'
import { rateLimiter } from './rate-limiting'

export const declareMiddlewares = (app: Express) => {
    // Middlewares
    app.use(cookieParser())
    app.use(helmet())
    app.use(compression())
    app.use(cors())
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
