import { PostType } from './PostType'
import { Votes } from './Votes'
import { UserType } from './UserType'

export type ReplyType = {
    id: string
    body: string
    author: Partial<UserType>
    authorId: string
    createdAt: Date
    updatedAt?: Date
    votes: Votes
    post?: PostType
    postId?: string
}

export type NewReplyType = {
    body: string
    authorId: string
    postId?: string
}
