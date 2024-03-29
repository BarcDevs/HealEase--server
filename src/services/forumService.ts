import { PostQuery, TagQuery } from '../types/query'
import * as forumModel from '../models/ForumModel'
import { getTagsByPostId } from '../models/ForumModel'
import { NewPostType, UpdatePostType } from '../types/data/PostType'
import { errorFactory } from '../errors/factory'

export const validateOwner = async (
    schema: 'post' | 'reply',
    id: string,
    userId: string
) => {
    const data =
        schema === 'post'
            ? await forumModel.getPost(id)
            : await forumModel.getReply(id)

    if (!data) throw new Error(`${schema} not found`)
    if (data.authorId !== userId)
        throw errorFactory.auth.unauthorized(
            `you are not the author of this ${schema}!`
        )
}

export const getPosts = async (query?: PostQuery, id?: string) => {
    if (id) return forumModel.getPost(id)
    return forumModel.getPosts(query)
}

export const getPostsCount = (query?: PostQuery) =>
    forumModel.getPostsCount(query)

export const createPost = async (post: NewPostType) =>
    forumModel.createPost(post)

export const updatePost = async (id: string, post: UpdatePostType) => {
    const prevTags = post.tags ? await getTagsByPostId(id) : undefined
    const removeTags = prevTags?.filter((tag) => !post.tags?.includes(tag.name))

    return forumModel.updatePost(id, post, removeTags)
}

export const deletePost = async (id: string) => forumModel.deletePost(id)

export const getTags = async (
    options: TagQuery | { filter: 'id'; id: string }
) =>
    options.filter === 'id'
        ? forumModel.getTagsByPostId(options.id)
        : options.filter === 'popular'
          ? forumModel.getPopularTags(options.limit)
          : forumModel.getTags(options.search, options.limit, options.page)

export const getTag = async (id: string) => forumModel.getTag(id)
