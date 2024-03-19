import { PrismaClient } from '@prisma/client'

let client: PrismaClient

export const getPrismaClient = (): PrismaClient => {
    if (!client) client = new PrismaClient()

    return client
}

const Prisma = getPrismaClient()

export default Prisma
