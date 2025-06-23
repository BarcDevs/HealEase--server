import { NextFunction, Request, Response } from 'express'
import { NewPostType, PostType } from '../types/data/PostType'
import { errorFactory } from '../errors/factory'
import * as forumService from '../services/forumService'
import { successResponse } from '../responses/success'
import { NewReplyType, ReplyType } from '../types/data/ReplyType'

export const bulkCreatePosts = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const posts = req.body as Array<NewPostType>

    if (!Array.isArray(posts) || posts.length === 0) {
        throw new Error('Invalid or empty post array')
    }

    const createdPosts = await Promise.all(
        posts.map(async (post) => {
            if (!post.authorId) {
                throw errorFactory.auth.unauthorized('Post is missing authorId')
            }

            return forumService.createPost({
                ...post
            })
        })
    )
    return successResponse<PostType[]>(
        res,
        createdPosts,
        'Posts created successfully'
    )
}

export const bulkCreateReplies = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const replies = req.body as Array<NewReplyType>

    if (!Array.isArray(replies) || replies.length === 0) {
        throw new Error('Invalid or empty replies array')
    }

    const createdReplies = await Promise.all(
        replies.map(async (reply) => {
            if (!reply.authorId || !reply.postId) {
                throw errorFactory.auth.unauthorized(
                    'Reply is missing authorId or postId'
                )
            }

            return forumService.createReply({
                ...reply
            })
        })
    )

    return successResponse<ReplyType[]>(
        res,
        createdReplies,
        'Replies created successfully'
    )
}
