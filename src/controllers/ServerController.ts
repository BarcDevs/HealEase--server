import type {
    Request,
    Response
} from 'express'
import { serverConfig } from '../../config'
import { HttpStatusCodes } from '../constants/httpStatusCodes'

export const getServerStatus = (
    _req: Request,
    res: Response
) => {
    res
        .status(HttpStatusCodes.OK)
        .json({
            message: `Server is running! use /api/${serverConfig.apiVersion}/ for api requests`
        })
}
