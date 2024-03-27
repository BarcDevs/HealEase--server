import { Express } from 'express'

import authRoute from '../AuthRoute'
import { errorHandler } from '../../middlewares/errorHandler'
import { RequestLocals } from '../../types/RequestLocals'

declare module 'express-serve-static-core' {
    interface Request {
        locals: RequestLocals
    }
}

export const declareRoutes = (app: Express) => {
    app.use('/api/v1/auth', authRoute)

    app.use('*', errorHandler)
}
