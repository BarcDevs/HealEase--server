import { Router } from 'express'
import { isAuthenticated } from '../middlewares/isAuthenticated'
import { csrfMiddleware } from '../middlewares/csrf'
import {
    createPost,
    createReply,
    getPost,
    getPosts,
    getReply,
    getTags,
    updatePost,
    updateReply
} from '../controllers/FormController'

const router = Router()

router
    .route('/posts')
    .get(getPosts)
    .post(isAuthenticated, csrfMiddleware, createPost)

router
    .route('/posts/:postId')
    .get(getPost)
    .put(isAuthenticated, csrfMiddleware, updatePost)
    .delete(isAuthenticated, csrfMiddleware, updatePost)

router
    .route('/posts/:postId/reply')
    .post(isAuthenticated, csrfMiddleware, createReply)

router
    .route('/posts/:postId/reply/:replyId')
    .get(getReply)
    .put(isAuthenticated, csrfMiddleware, updateReply)
    .delete(isAuthenticated, csrfMiddleware, updateReply)

router.route('/tags').get(getTags)

export default router
