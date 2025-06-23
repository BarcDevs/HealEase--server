import { Router } from 'express'
import { isAuthenticated } from '../middlewares/isAuthenticated'
import { csrfMiddleware, extractCsrfToken } from '../middlewares/csrf'
import { bulkCreatePosts } from '../controllers/bulkActionsController'

const router = Router()

router
    .route('/create-posts')
    .post(isAuthenticated, extractCsrfToken, csrfMiddleware, bulkCreatePosts)

export default router
