import { PrismaClient } from '@prisma/client'
import { env } from '../../config'

let client: PrismaClient

export const getPrismaClient = (): PrismaClient => {
    if (!client)
        client = new PrismaClient({
            errorFormat: 'minimal',
            log:
                env === 'development'
                    ? ['query', 'info', 'warn', 'error']
                    : undefined
        })

    return client
}

const Prisma = getPrismaClient()

export default Prisma
