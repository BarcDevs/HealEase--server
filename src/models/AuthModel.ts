import { NewUserType, ServerUserType } from '../types/data/UserType'
import Prisma from '../utils/PrismaClient'
// @ts-ignore
import { catchModel } from '../utils/catch'
// @ts-ignore
import { ErrorPrefixes } from '../constants/errorPrefixes'

const getUserById = catchModel(
    async (id: string): Promise<ServerUserType | null> => {
        const user = await Prisma.user.findUnique({
            where: {
                id,
                active: true,
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
                active: true,
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
                active: true,
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
                active: true,
            },
            data,
        }) as Promise<ServerUserType>,
    ErrorPrefixes.UPDATE,
)

const disableUser = catchModel(
    (id: string): Promise<ServerUserType> =>
        Prisma.user.update({
            where: {
                id,
            },
            data: {
                active: false,
            },
        }) as Promise<ServerUserType>,
    ErrorPrefixes.DELETE,
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

export {
    getUserById,
    getUserByEmail,
    createUser,
    updateUser,
    disableUser,
    deleteUser,
}
