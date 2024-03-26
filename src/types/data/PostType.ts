import { ExcludedUserType } from './UserType'
import { ReplyType } from './ReplyType'
import { Votes } from './Votes'
import { TagType } from './TagType'

export type PostType = {
    id: string
    title: string
    body: string
    author?: Partial<ExcludedUserType>
    authorId?: string
    createdAt: Date
    updatedAt?: Date
    votes: Votes
    replies: ReplyType[] | number
    views: number
    category: string
    tags: TagType[]
}
