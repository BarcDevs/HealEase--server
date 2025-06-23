import { Router } from 'express'
import { isAuthenticated } from '../middlewares/isAuthenticated'
import { csrfMiddleware, extractCsrfToken } from '../middlewares/csrf'
import {
    bulkCreatePosts,
    bulkCreateReplies
} from '../controllers/bulkActionsController'

const router = Router()

router
    .route('/create-posts')
    .post(isAuthenticated, extractCsrfToken, csrfMiddleware, bulkCreatePosts)

router
    .route('/create-replies')
    .post(isAuthenticated, extractCsrfToken, csrfMiddleware, bulkCreateReplies)

export default router
