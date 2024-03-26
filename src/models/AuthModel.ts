import { NewUserType, ServerUserType } from '../types/data/UserType'
import Prisma from '../utils/PrismaClient'
import { catchModel } from '../utils/catch'
import { ErrorPrefixes } from '../constants/errorPrefixes'

const getUserById = catchModel(
    async (id: string): Promise<ServerUserType | null> => {
        const user = await Prisma.user.findUnique({
            where: {
                id,
            },
        })

        if (!user) return null

        return user as ServerUserType
    },
    ErrorPrefixes.FETCH,
)

const getUserByEmail = catchModel(
    async (email: string): Promise<ServerUserType | null> => {
        const user = await Prisma.user.findUnique({
            where: {
                email,
            },
        })

        if (!user) return null

        return user as ServerUserType
    },
    ErrorPrefixes.FETCH,
)

const createUser = catchModel(
    (newUser: NewUserType): Promise<ServerUserType> =>
        Prisma.user.create({
            data: newUser,
        }) as Promise<ServerUserType>,
    ErrorPrefixes.REGISTRATION,
)

const updateUser = catchModel(
    (
        userId: string,
        newUserData: Partial<NewUserType>,
    ): Promise<ServerUserType> =>
        Prisma.user.update({
            where: {
                id: userId,
            },
            data: newUserData,
        }) as Promise<ServerUserType>,
    ErrorPrefixes.UPDATE,
)

export const setUserOTP = catchModel(
    (
        userId: string,
        data: {
            resetPasswordOTP: number | null
            resetPasswordExpiration: Date | null
            password_updated_at?: Date
        },
    ): Promise<ServerUserType> =>
        Prisma.user.update({
            where: {
                id: userId,
            },
            data,
        }) as Promise<ServerUserType>,
    ErrorPrefixes.UPDATE,
)

const deleteUser = catchModel(
    (id: string): Promise<ServerUserType> =>
        Prisma.user.delete({
            where: {
                id,
            },
        }) as Promise<ServerUserType>,
    ErrorPrefixes.DELETE,
)

export { getUserById, getUserByEmail, createUser, updateUser, deleteUser }
