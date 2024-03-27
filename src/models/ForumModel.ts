import { Prisma as PrismaTypes } from '@prisma/client'
import { PostQuery } from '../types/query'
import Prisma from '../utils/PrismaClient'
import { connectTags, postInclude, postQueryBuilder } from './queries/postQuery'
import { NewPostType, PostType, UpdatePostType } from '../types/data/PostType'
import { TagType } from '../types/data/TagType'

export const getPosts = async (
    query: PostQuery | undefined = undefined,
): Promise<PostType[]> => {
    const postQuery = query ? postQueryBuilder(query) : {}

    return (await Prisma.post.findMany({
        take: query?.limit || 10,
        skip: (query?.page ? query.page - 1 : 0) * (query?.limit || 10),
        ...postQuery,
    })) as PostType[]
}

export const getPostsCount = async (
    query: PostQuery | undefined = undefined,
): Promise<{ count: number }> => {
    const postQuery = query ? postQueryBuilder(query) : {}

    return {
        count: await Prisma.post.count({
            ...postQuery,
        }),
    } as { count: number }
}

export const getPost = async (id: string): Promise<PostType | null> =>
    (await Prisma.post.findUnique({
        where: {
            id,
            author: {
                active: true,
            },
        },
        include: postInclude('single'),
    })) as PostType | null

export const createPost = async (post: NewPostType): Promise<PostType> => {
    const { authorId, tags, ...postData } = post

    return (await Prisma.post.create({
        data: {
            ...postData,
            author: {
                connect: {
                    id: authorId,
                },
            },
            tags: {
                ...connectTags(tags),
            },
        } as PrismaTypes.PostCreateInput,
        include: postInclude('single'),
    })) as unknown as PostType
}

export const updatePost = async (
    id: string,
    post: UpdatePostType,
): Promise<PostType> => {
    // eslint-disable-next-line no-use-before-define
    const prevTags = post.tags ? await getTagsByPostId(id) : undefined
    const removeTags = prevTags?.filter((tag) => !post.tags?.includes(tag.name))

    return (await Prisma.post.update({
        where: {
            id,
        },
        data: {
            ...post,
            tags: {
                disconnect: removeTags?.map((tag) => ({ id: tag.id })),
                ...connectTags(post.tags || []),
            },
        },
        include: postInclude('single'),
    })) as unknown as PostType
}

export const deletePost = async (id: string) =>
    Prisma.post.delete({
        where: {
            id,
        },
    })

export const getTags = async (limit: 10, page: 0): Promise<TagType[]> =>
    (await Prisma.tag.findMany({
        take: limit,
        skip: page * limit,
    })) as TagType[]

export const getPopularTags = async (limit = 10): Promise<TagType[]> =>
    (await Prisma.tag.findMany({
        orderBy: {
            posts: {
                _count: 'desc',
            },
        } as PrismaTypes.TagOrderByWithRelationInput,
        take: limit,
    })) as TagType[]

export const getTagsByPostId = async (id: string): Promise<TagType[]> =>
    (await Prisma.tag.findMany({
        where: {
            posts: {
                some: {
                    id,
                },
            },
        },
    })) as TagType[]
