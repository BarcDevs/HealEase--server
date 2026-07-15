import type { Request, Response } from 'express'

import { ValidationError }
    from '../errors/ValidationError'
import { successResponse } from '../responses/success'
import { updateProfileSchema }
    from '../schemas/profile/updateProfileSchema'
import * as profileService
    from '../services/profileService'
import { extractUserId } from '../utils/controllerHelpers'

export const getProfile = async (
    req: Request,
    res: Response
) => {
    const userId = extractUserId(req)
    const includePosts = req.query.includePosts === 'true'

    const profile =
        await profileService.getProfile(
            userId,
            includePosts
        )

    return successResponse(
        res,
        profile,
        'Profile retrieved successfully'
    )
}

export const updateProfile = async (
    req: Request,
    res: Response
) => {
    const userId = extractUserId(req)

    const validatedData =
        ValidationError.catchValidationErrors(
            updateProfileSchema.safeParse(
                req.body
            )
        )

    const profile =
        await profileService.updateProfile(
            userId,
            validatedData
        )

    return successResponse(
        res,
        profile,
        'Profile updated successfully'
    )
}

export const getHealthInterests = async (
    req: Request,
    res: Response
) => {
    const interests =
        await profileService
            .getAvailableHealthInterests()

    return successResponse(
        res,
        interests,
        `${interests.length} health interests available`
    )
}

export const getActivityPreferences = (
    req: Request,
    res: Response
) => {
    const activities =
        profileService.getAvailableActivityPreferences()

    return successResponse(
        res,
        activities,
        `${activities.length} activity preferences available`
    )
}