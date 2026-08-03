import type { Request, Response } from 'express'

import { successResponse } from '../responses/success'
import * as recommendationsService from '../services/recommendationsService'
import type { RecommendationsResponse } from '../types/data/RecommendationResponseType'
import { extractUserId } from '../utils/controllerHelpers'

export const getRecommendations = async (
    req: Request,
    res: Response
) => {
    const userId = extractUserId(req)

    const data =
        await recommendationsService.getRecommendations(userId)

    return successResponse<RecommendationsResponse>(
        res,
        data,
        'Recommendations retrieved'
    )
}
