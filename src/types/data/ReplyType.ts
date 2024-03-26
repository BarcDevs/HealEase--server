import { PostType } from './PostType'
import { ExcludedUserType } from './UserType'
import { Votes } from './Votes'

export type ReplyType = {
    id: string
    body: string
    author: Partial<ExcludedUserType>
    authorId: string
    createdAt: Date
    updatedAt?: Date
    votes: Votes
    post?: PostType
    postId?: string
}
