import crypto from 'crypto'
import type {
    NextFunction,
    Request,
    Response
} from 'express'

import logger from '../utils/logger'

export const loggerMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const start = Date.now()
    req.requestId = crypto.randomUUID()

    res.on('finish', () => {
        const ms = Date.now() - start
        const { method, path, requestId } = req
        const status = res.statusCode
        const userId = req.userId ?? '-'

        logger.http(
            `${method} ${path}
             ${status} ${ms}ms
             userId=${userId} requestId=${requestId}`
        )
    })

    next()
}
