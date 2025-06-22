import { Router } from 'express'
import { isAuthenticated } from '../middlewares/isAuthenticated'
import { csrfMiddleware, extractCsrfToken } from '../middlewares/csrf'
import {
    getPost,
    getPosts,
    createPost,
    updatePost,
    deletePost,
    getReply,
    createReply,
    updateReply,
    getTags,
    getTag
} from '../controllers/ForumController'

const router = Router()

router
    .route('/posts')
    .get(getPosts)
    .post(isAuthenticated, extractCsrfToken, csrfMiddleware, createPost)

router
    .route('/posts/:postId')
    .get(getPost)
    .put(isAuthenticated, extractCsrfToken, csrfMiddleware, updatePost)
    .delete(isAuthenticated, extractCsrfToken, csrfMiddleware, deletePost)

router
    .route('/posts/:postId/reply')
    .post(isAuthenticated, extractCsrfToken, csrfMiddleware, createReply)

router
    .route('/posts/:postId/reply/:replyId')
    .get(getReply)
    .put(isAuthenticated, extractCsrfToken, csrfMiddleware, updateReply)
    .delete(isAuthenticated, extractCsrfToken, csrfMiddleware, updateReply)

router.route('/tags').get(getTags)

router.route('/tags/:tagId').get(getTag)

export default router
