import Prisma from '../utils/prismaClient'

export const pingDatabase = async (): Promise<void> => {
    await Prisma.$queryRaw`SELECT 1`
}
