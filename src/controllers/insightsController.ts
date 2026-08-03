import type { Request, Response } from 'express'

import { successResponse } from '../responses/success'
import { getTodayObservation } from '../services/dailyObservationService'
import type { TodayObservationResponse } from '../types/data/DailyObservationType'
import { extractUserId } from '../utils/controllerHelpers'

export const getObservation = async (
    req: Request,
    res: Response
) => {
    const userId = extractUserId(req)

    const data = await getTodayObservation(userId)

    return successResponse<TodayObservationResponse | null>(
        res,
        data,
        'Observation retrieved'
    )
}
