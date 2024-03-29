import { Router } from 'express'
import {
    confirmEmail,
    forgotPassword,
    getCsrfToken,
    login,
    logout,
    me,
    resetPassword,
    signup
} from '../controllers/AuthController'
import { cacheMiddleware } from '../middlewares/cache'
import { isAuthenticated } from '../middlewares/isAuthenticated'
import { csrfMiddleware } from '../middlewares/csrf'

const router = Router()

router.route('/login').post(login)

router.route('/signup').post(signup)

router.route('/csrf').get(isAuthenticated, getCsrfToken)

router.route('/logout').get(logout)

router.route('/me').get(isAuthenticated, cacheMiddleware, me)

router.route('/forget-password/:email').get(forgotPassword)

router.route('/confirm-email').post(csrfMiddleware, confirmEmail)

router.route('/reset-password').put(csrfMiddleware, resetPassword)

export default router
