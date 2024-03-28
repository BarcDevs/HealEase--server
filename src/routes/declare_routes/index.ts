import express, { Express } from 'express'

import { errorHandler } from '../../middlewares/errorHandler'
import { RequestLocals } from '../../types/RequestLocals'
import { getServerStatus } from '../../controllers/ServerController'
import { serverConfig } from '../../../config'
import authRoute from '../AuthRoute'
import forumRoute from '../ForumRoute'

declare module 'express-serve-static-core' {
    interface Request {
        locals: RequestLocals
    }
}

export const declareRoutes = (app: Express) => {
    app.get('/', getServerStatus)

    app.use(`/api/${serverConfig.apiVersion}/forum`, forumRoute)
    app.use(`/api/${serverConfig.apiVersion}/auth`, authRoute)

    app.use('*', errorHandler)
}
