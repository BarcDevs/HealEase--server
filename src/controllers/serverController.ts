import type {
    Request,
    Response
} from 'express'

import {
    env,
    googleOAuthConfig,
    isDev,
    serverConfig
} from '../../config'
import { version } from '../../package.json'
import { HttpStatusCodes } from '../constants/httpStatusCodes'
import { isDatabaseReady } from '../services/serverService'

export const getServerStatus = (
    _req: Request,
    res: Response
) => {
    res
        .status(HttpStatusCodes.OK)
        .json({
            message: `Server is running! use /api/${serverConfig.apiVersion}/ for api requests`,
            version,
            ...(isDev && {
                config: {
                    CORS_Origin: serverConfig.origin,
                    NODE_ENV: env,
                    googleRedirectUri: googleOAuthConfig.redirectUri
                }
            })
        })
}

export const getServerReadiness = async (
    _req: Request,
    res: Response
) => {
    const databaseReady = await isDatabaseReady()

    res
        .status(databaseReady ? HttpStatusCodes.OK : HttpStatusCodes.SERVICE_UNAVAILABLE)
        .json({ database: databaseReady ? 'connected' : 'unavailable' })
}