import { UserType } from '../types/UserType'
import Prisma from '../utils/PrismaClient'
import { AuthError } from '../errors/AuthError'

const getUserById = async (id: string): Promise<UserType | null> => {
    try {
        const user = await Prisma.user.findUnique({
            where: {
                id,
            },
        })

        if (!user) return null

        return user
    } catch (error) {
        const err = error as Error
        throw new Error(`[AUTHENTICATION ERROR]: ${err.message}`)
    }
}

const getUserByEmail = async (email: string): Promise<UserType | null> => {
    try {
        const user = await Prisma.user.findFirst({
            where: {
                email,
            },
        })

        if (!user) return null

        return user
    } catch (error) {
        const err = error as Error
        throw new AuthError(err.message)
    }
}

const createUser = (newUser: UserType): Promise<UserType> => {
    try {
        return Prisma.user.create({
            data: newUser,
        })
    } catch (error) {
        const err = error as Error
        throw new Error(`[REGISTRATION ERROR]: ${err.message}`)
    }
}

const updateUser = (
    userId: string,
    newUserData: Partial<UserType>,
): Promise<UserType> => {
    try {
        return Prisma.user.update({
            where: {
                id: userId,
            },
            data: newUserData,
        })
    } catch (error) {
        const err = error as Error
        throw new Error(`[UPDATE ERROR]: ${err.message}`)
    }
}

const deleteUser = (id: string): Promise<UserType> => {
    try {
        return Prisma.user.delete({
            where: {
                id,
            },
        })
    } catch (error) {
        const err = error as Error
        throw new Error(`[DELETE ERROR]: ${err.message}`)
    }
}

export { getUserById, getUserByEmail, createUser, updateUser, deleteUser }
