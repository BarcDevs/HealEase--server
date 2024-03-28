import { NextFunction, Request, Response } from 'express'
import { postQuerySchema } from '../schemas/forum/postQuerySchema'
import { ValidationError } from '../errors/ValidationError'
import * as forumService from '../services/forumService'
import { PostType } from '../types/data/PostType'
import { successResponse } from '../responses/success'
import { newPostSchema } from '../schemas/forum/newPostSchema'
import { updatePostSchema } from '../schemas/forum/updatePostSchema'
import { errorFactory } from '../errors/factory'
import { tagQuerySchema } from '../schemas/forum/tagQuerySchema'
import { TagType } from '../types/data/TagType'

export const getPosts = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const validatedQuery =
        req.body &&
        ValidationError.catchValidationErrors(
            postQuerySchema.validate(req.body)
        )

    const data = (await forumService.getPosts(validatedQuery)) as
        | PostType[]
        | null

    if (!data)
        // todo throw next() error with generic error class
        return res.status(404).json({ message: 'posts not found' })

    return successResponse<PostType[]>(res, data)
}

export const createPost = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const validatedData = ValidationError.catchValidationErrors(
        newPostSchema.validate({
            ...req.body,
            tags: req.body.tags.split(',')
        })
    )
    const { userId } = req.locals || {}

    if (!userId) throw errorFactory.auth.unauthorized()

    const data = await forumService.createPost({
        ...validatedData,
        authorId: userId
    })
    return successResponse<PostType>(res, data)
}

export const getPost = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const data = (await forumService.getPosts(
        undefined,
        req.params.postId
    )) as PostType | null

    if (!data)
        // todo throw next() error with generic error class
        return res.status(404).json({ message: 'post not found' })

    return successResponse<PostType>(res, data)
}

export const updatePost = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const validatedData = ValidationError.catchValidationErrors(
        updatePostSchema.validate({
            ...req.body,
            tags: req.body.tags.split(',')
        })
    )
    const { postId } = req.params
    const { userId } = req.locals || {}

    if (!userId) throw errorFactory.auth.unauthorized()

    if (!(await forumService.validateOwner('post', postId, userId)))
        throw errorFactory.auth.unauthorized(
            'you are not the author of this post!'
        )

    const data = await forumService.updatePost(postId, validatedData)
    return successResponse<PostType>(res, data)
}

export const createReply = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {}

export const getReply = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {}

export const updateReply = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {}

export const getTags = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const validatedQuery =
        req.query &&
        ValidationError.catchValidationErrors(
            tagQuerySchema.validate(req.query)
        )

    const data = await forumService.getTags(validatedQuery)

    return successResponse<TagType[]>(res, data)
}
