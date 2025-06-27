import { Express } from 'express'

import { errorHandler } from '../../middlewares/errorHandler'
import { getServerStatus } from '../../controllers/ServerController'
import { serverConfig } from '../../../config'
import authRoute from '../AuthRoute'
import forumRoute from '../ForumRoute'
import bulkRoute from '../bukActionsRoute'

declare module 'express-serve-static-core' {
    interface Request {
        userId?: string
        csrfToken?: string
    }
}

const baseRoute = (route: string) => `/api/${serverConfig.apiVersion}/${route}`

export const declareRoutes = (app: Express) => {
    app.get('/api/status', getServerStatus)

    app.use(baseRoute('forum'), forumRoute)
    app.use(baseRoute('auth'), authRoute)

    app.use(`/api/${serverConfig.apiVersion}/bulk`, bulkRoute)

    app.use('*', errorHandler)
}
