import { UserType } from './UserType'
import { ReplyType } from './ReplyType'
import { Votes } from './Votes'
import { TagType } from './TagType'

export type PostType = {
    id: string
    title: string
    body: string
    author?: Partial<UserType>
    authorId?: string
    createdAt: Date
    updatedAt?: Date
    votes: Votes | string
    replies: ReplyType[]
    views: number
    category: string
    tags: TagType[]
    _count?: {
        replies: number
    }
}

export type NewPostType = {
    title: string
    body: string
    category: string
    authorId: string
    tags: string[]
}

export type UpdatePostType = Partial<
    Omit<NewPostType, 'authorId'> & {
        votes: Votes | string
        removeTags?: string[]
    }
>
