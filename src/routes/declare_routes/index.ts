import { Express } from 'express'

import authRoute from '../AuthRoute'
import { errorHandler } from '../../middlewares/errorHandler'

export const declareRoutes = (app: Express) => {
    app.use('/api/v1/auth', authRoute)

    app.use('*', errorHandler)
}
