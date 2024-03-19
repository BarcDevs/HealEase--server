import { Router } from 'express'
import {
    confirmEmail,
    forgotPassword,
    login,
    logout,
    me,
    resetPassword,
    signup,
} from '../controllers/AuthController'
import { cacheMiddleware } from '../middlewares/cache'
import { isAuthenticated } from '../middlewares/isAuthenticated'
import { csrfMiddleware } from '../middlewares/csrf'

declare module 'express-serve-static-core' {
    interface Request {
        locals: Record<string, unknown>
    }
}

const router = Router()

router.route('/login').get(login)

router.route('/signup').post(signup)

router.route('/logout').get(logout)

router.route('/me').get(isAuthenticated, cacheMiddleware, me)

router.route('/forget-password/:email').get(forgotPassword)

router.route('/confirm-email').post(csrfMiddleware, confirmEmail)

router.route('/reset-password').put(csrfMiddleware, resetPassword)

export default router
