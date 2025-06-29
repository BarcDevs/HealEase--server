import { Router } from 'express'

import {
    bulkCreatePosts,
    bulkCreateReplies
} from '../controllers/bulkActionsController'
import {
    csrfMiddleware,
    extractCsrfToken
} from '../middlewares/csrf'
import { isAuthenticated } from '../middlewares/isAuthenticated'

const router = Router()

router
    .route('/create-posts')
    .post(isAuthenticated, extractCsrfToken, csrfMiddleware, bulkCreatePosts)

router
    .route('/create-replies')
    .post(isAuthenticated, extractCsrfToken, csrfMiddleware, bulkCreateReplies)

export default router
