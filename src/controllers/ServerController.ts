import { NextFunction, Request, Response } from 'express'
import { HttpStatusCodes } from '../constants/httpStatusCodes'
import { serverConfig } from '../../config'

export const getServerStatus = (
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    res.status(HttpStatusCodes.OK).json({
        message: `Server is running! use /api/${serverConfig.apiVersion}/ for api requests`
    })
}
