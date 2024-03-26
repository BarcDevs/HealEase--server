import { NewUserType, ServerUserType } from '../types/data/UserType'
import Prisma from '../utils/PrismaClient'
import { AuthError } from '../errors/AuthError'

const getUserById = async (id: string): Promise<ServerUserType | null> => {
    try {
        const user = await Prisma.user.findUnique({
            where: {
                id,
            },
        })

        if (!user) return null

        return user as ServerUserType
    } catch (error) {
        const err = error as Error
        throw new Error(`[AUTHENTICATION ERROR]: ${err.message}`)
    }
}

const getUserByEmail = async (
    email: string,
): Promise<ServerUserType | null> => {
    try {
        const user = await Prisma.user.findUnique({
            where: {
                email,
            },
        })

        if (!user) return null

        return user as ServerUserType
    } catch (error) {
        const err = error as Error
        throw new AuthError(err.message)
    }
}

const createUser = (newUser: NewUserType): Promise<ServerUserType> => {
    try {
        return Prisma.user.create({
            data: newUser,
        }) as Promise<ServerUserType>
    } catch (error) {
        const err = error as Error
        throw new Error(`[REGISTRATION ERROR]: ${err.message}`)
    }
}

const updateUser = (
    userId: string,
    newUserData: Partial<NewUserType>,
): Promise<ServerUserType> => {
    try {
        return Prisma.user.update({
            where: {
                id: userId,
            },
            data: newUserData,
        }) as Promise<ServerUserType>
    } catch (error) {
        const err = error as Error
        throw new Error(`[UPDATE ERROR]: ${err.message}`)
    }
}

export const setUserOTP = (
    userId: string,
    data: {
        resetPasswordOTP: number | null
        resetPasswordExpiration: Date | null
        password_updated_at?: Date
    },
): Promise<ServerUserType> => {
    try {
        return Prisma.user.update({
            where: {
                id: userId,
            },
            data,
        }) as Promise<ServerUserType>
    } catch (error) {
        const err = error as Error
        throw new Error(`[UPDATE ERROR]: ${err.message}`)
    }
}

const deleteUser = (id: string): Promise<ServerUserType> => {
    try {
        return Prisma.user.delete({
            where: {
                id,
            },
        }) as Promise<ServerUserType>
    } catch (error) {
        const err = error as Error
        throw new Error(`[DELETE ERROR]: ${err.message}`)
    }
}

export { getUserById, getUserByEmail, createUser, updateUser, deleteUser }
