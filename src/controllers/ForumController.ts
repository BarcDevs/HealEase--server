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
import { ReplyType } from '../types/data/ReplyType'
import { newReplySchema } from '../schemas/forum/newReplySchema'

export const getPosts = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const validatedQuery =
        req.params &&
        ValidationError.catchValidationErrors(
            postQuerySchema.validate(req.params)
        )

    const data = (await forumService.getPosts(validatedQuery)) as
        | PostType[]
        | null

    if (!data)
        // todo throw next() error with generic error class
        return res.status(404).json({ message: 'posts not found' })

    return successResponse<PostType[]>(res, data, `${data.length} posts found`)
}

export const createPost = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const validatedData = ValidationError.catchValidationErrors(
        newPostSchema.validate(req.body)
    )
    const { userId } = req.locals || {}

    if (!userId) throw errorFactory.auth.unauthorized()

    const data = await forumService.createPost({
        ...validatedData,
        authorId: userId
    })
    return successResponse<PostType>(res, data, 'Post created successfully')
}

export const getPost = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { postId } = req.params
    const data = (await forumService.getPosts(
        undefined,
        postId
    )) as PostType | null

    if (!data)
        // todo throw next() error with generic error class
        return res.status(404).json({ message: 'post not found' })

    return successResponse<PostType>(res, data, `Post ${postId} found`)
}

export const updatePost = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const validatedData = ValidationError.catchValidationErrors(
        updatePostSchema.validate(req.body)
    )
    const { postId } = req.params
    const { userId } = req.locals || {}

    if (!userId) throw errorFactory.auth.unauthorized()

    await forumService.validateOwner('post', postId, userId)

    const data = await forumService.updatePost(postId, validatedData)
    return successResponse<PostType>(res, data, `Post ${postId} updated`)
}

export const deletePost = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { postId } = req.params
    const { userId } = req.locals || {}

    if (!userId) throw errorFactory.auth.unauthorized()

    await forumService.validateOwner('post', postId, userId)

    await forumService.deletePost(postId)
    return successResponse(res, {}, `post ${postId} deleted!`)
}

export const createReply = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const validatedData = ValidationError.catchValidationErrors(
        newReplySchema.validate(req.body)
    )
    const { userId } = req.locals || {}
    const { postId } = req.params

    if (!userId) throw errorFactory.auth.unauthorized()

    const data = await forumService.createReply({
        ...validatedData,
        postId,
        authorId: userId
    })
    return successResponse<ReplyType>(res, data, 'Reply created successfully')
}

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

    return successResponse<TagType[]>(res, data, `${data.length} tags found`)
}

export const getTag = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { tagId } = req.params

    const data = await forumService.getTag(tagId)

    if (!data) throw Error('not found')

    return successResponse<TagType>(res, data, `tag ${tagId} found`)
}
