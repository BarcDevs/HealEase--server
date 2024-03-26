import { PostType } from './PostType'
import { UserType } from './UserType'

export interface TagType {
    id: string
    name: string
    description?: string
    posts?: PostType[] | number
    followers?: Partial<UserType>[] | number
    createdAt: Date
}
