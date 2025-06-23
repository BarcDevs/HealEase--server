import { NextFunction, Request, Response } from 'express'
import { NewPostType, PostType } from '../types/data/PostType'
import { errorFactory } from '../errors/factory'
import * as forumService from '../services/forumService'
import { successResponse } from '../responses/success'

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
