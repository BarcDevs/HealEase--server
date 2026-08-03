import type { Request, Response } from 'express'

import { type GoalStatus } from '../../prisma/generated/prisma/enums'
import { HttpStatusCodes } from '../constants/httpStatusCodes'
import { errorFactory } from '../errors/factory/ErrorFactory'
import { successResponse } from '../responses/success'
import type { GetGoalsQueryType } from '../schemas/recoveryGoal/getGoalsQuerySchema'
import { getGoalsQuerySchema } from '../schemas/recoveryGoal/getGoalsQuerySchema'
import type { NewGoalType } from '../schemas/recoveryGoal/newGoalSchema'
import { newGoalSchema } from '../schemas/recoveryGoal/newGoalSchema'
import type { NewMilestoneType } from '../schemas/recoveryGoal/newMilestoneSchema'
import { newMilestoneSchema } from '../schemas/recoveryGoal/newMilestoneSchema'
import { updateGoalSchema } from '../schemas/recoveryGoal/updateGoalSchema'
import type { UpdateMilestoneType } from '../schemas/recoveryGoal/updateMilestoneSchema'
import { updateMilestoneSchema } from '../schemas/recoveryGoal/updateMilestoneSchema'
import * as recoveryGoalService from '../services/recoveryGoalService'
import type {
    MilestoneType,
    RecoveryGoalWithProgress,
    UpdateRecoveryGoalType
} from '../types/data/RecoveryGoalType'
import {
    extractUserId,
    validateAndExtract
} from '../utils/controllerHelpers'

const validateId = (
    id: string | undefined,
    fieldName: string
): void => {
    const isValid = (
        typeof id === 'string'
        && id.trim()
    )
    if (!isValid)
        throw errorFactory.generic
            .notFound(`Invalid ${fieldName}`)
}

export const createGoal = async (
    req: Request,
    res: Response
) => {
    const validatedData = validateAndExtract<NewGoalType>(
        newGoalSchema,
        req.body
    )
    const userId = extractUserId(req)

    const goal = await (
        recoveryGoalService.createGoal(
            userId,
            validatedData
        )
    )
    successResponse<RecoveryGoalWithProgress>(
        res,
        goal,
        'Goal created successfully',
        HttpStatusCodes.CREATED
    )
}

export const getGoals = async (
    req: Request,
    res: Response
) => {
    const userId = extractUserId(req)

    const { status } = validateAndExtract<GetGoalsQueryType>(
        getGoalsQuerySchema,
        req.query
    )

    const statusFilter = status?.toUpperCase() as GoalStatus | undefined

    const goals = await recoveryGoalService.getUserGoals(
        userId,
        statusFilter
    )
    successResponse<RecoveryGoalWithProgress[]>(
        res,
        goals,
        'Goals retrieved successfully',
        HttpStatusCodes.OK
    )
}

export const getGoal = async (
    req: Request,
    res: Response
) => {
    const userId = extractUserId(req)
    const { goalId } = req.params as Record<
        string,
        string
    >
    validateId(goalId, 'goalId')

    const result = await (
        recoveryGoalService.getGoal(
            goalId,
            userId
        )
    )
    successResponse(
        res,
        result,
        'Goal retrieved successfully',
        HttpStatusCodes.OK
    )
}

export const updateGoal = async (
    req: Request,
    res: Response
) => {
    const validatedData = validateAndExtract<
        UpdateRecoveryGoalType
    >(updateGoalSchema, req.body)
    const userId = extractUserId(req)
    const { goalId } = req.params as Record<
        string,
        string
    >
    validateId(goalId, 'goalId')

    const goal = await (
        recoveryGoalService.updateGoal(
            goalId,
            userId,
            validatedData
        )
    )
    successResponse<RecoveryGoalWithProgress>(
        res,
        goal,
        'Goal updated successfully',
        HttpStatusCodes.OK
    )
}

export const deleteGoal = async (
    req: Request,
    res: Response
) => {
    const userId = extractUserId(req)
    const { goalId } = req.params as Record<
        string,
        string
    >
    validateId(goalId, 'goalId')

    await recoveryGoalService.deleteGoal(
        goalId,
        userId
    )
    successResponse(
        res,
        null,
        'Goal deleted successfully',
        HttpStatusCodes.OK
    )
}

export const createMilestones = async (
    req: Request,
    res: Response
) => {
    const validatedData = validateAndExtract<NewMilestoneType>(
        newMilestoneSchema,
        req.body
    )
    const userId = extractUserId(req)
    const { goalId } = req.params as Record<
        string,
        string
    >
    validateId(goalId, 'goalId')

    const nextOrder = await (
        recoveryGoalService
            .getMaxMilestoneOrder(goalId, userId)
    )
    const milestones = await (
        recoveryGoalService.createMilestones(
            goalId,
            userId,
            {
                milestones: [
                    {
                        title: validatedData.title,
                        description: (
                            validatedData
                                .description
                        ),
                        order: nextOrder
                    }
                ]
            }
        )
    )
    successResponse(
        res,
        milestones,
        'Milestones created successfully',
        HttpStatusCodes.CREATED
    )
}

export const updateMilestone = async (
    req: Request,
    res: Response
) => {
    const validatedData = validateAndExtract<UpdateMilestoneType>(
        updateMilestoneSchema,
        req.body
    )
    const userId = extractUserId(req)
    const { milestoneId } = req.params as Record<
        string,
        string
    >
    validateId(milestoneId, 'milestoneId')

    const milestone = await (
        recoveryGoalService.updateMilestone(
            milestoneId,
            userId,
            validatedData
        )
    )
    successResponse<MilestoneType>(
        res,
        milestone,
        'Milestone updated successfully',
        HttpStatusCodes.OK
    )
}

export const deleteMilestone = async (
    req: Request,
    res: Response
) => {
    const userId = extractUserId(req)
    const { milestoneId } = req.params as Record<
        string,
        string
    >
    validateId(milestoneId, 'milestoneId')

    await recoveryGoalService.deleteMilestone(
        milestoneId,
        userId
    )
    successResponse(
        res,
        null,
        'Milestone deleted successfully',
        HttpStatusCodes.OK
    )
}

export const completeMilestone = async (
    req: Request,
    res: Response
) => {
    const userId = extractUserId(req)
    const { goalId, milestoneId } = (
        req.params as {
            goalId: string
            milestoneId: string
        }
    )
    validateId(goalId, 'goalId')
    validateId(milestoneId, 'milestoneId')

    await recoveryGoalService
        .completeMilestone(
            milestoneId,
            goalId,
            userId
        )
    successResponse(
        res,
        null,
        'Milestone completed successfully',
        HttpStatusCodes.OK
    )
}

export const completeGoal = async (
    req: Request,
    res: Response
) => {
    const userId = extractUserId(req)
    const { goalId } = req.params as {
        goalId: string
    }
    validateId(goalId, 'goalId')

    const goal = await (
        recoveryGoalService.completeGoal(
            goalId,
            userId
        )
    )
    successResponse<RecoveryGoalWithProgress>(
        res,
        goal,
        'Goal completed successfully',
        HttpStatusCodes.OK
    )
}

export const getStats = async (
    req: Request,
    res: Response
) => {
    const userId = extractUserId(req)

    const {
        fromDate,
        toDate,
        category
    } = (
        req.query as Record<
            string,
            string | undefined
        >
    )

    const filters = {
        fromDate: fromDate
            ? new Date(fromDate)
            : undefined,
        toDate: toDate
            ? new Date(toDate)
            : undefined,
        category
    }

    const stats = await (
        recoveryGoalService.getStats(
            userId,
            filters
        )
    )
    successResponse(
        res,
        stats,
        'Stats retrieved successfully',
        HttpStatusCodes.OK
    )
}
