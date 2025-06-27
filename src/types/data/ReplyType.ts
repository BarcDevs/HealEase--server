import { Votes } from './Votes'
import { UserType } from './UserType'
import { PostType } from './PostType'

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

export type UpdateReplyType = Partial<
    Omit<NewReplyType, 'authorId'> & {
        vote?: {
            userId: string
            vote: 'up' | 'down'
        }
    }
>
