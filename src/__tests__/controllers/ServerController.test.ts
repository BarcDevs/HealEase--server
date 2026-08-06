import type { Request, Response } from 'express'

import { HttpStatusCodes } from '../../constants/httpStatusCodes'
import * as serverController from '../../controllers/serverController'
import * as serverService from '../../services/serverService'
import {
    createMockRequest,
    createMockResponse
} from '../setup/testSetup'

jest.mock('../../services/serverService', () => ({
    isDatabaseReady: jest.fn()
}))

describe('serverController', () => {
    describe('getServerReadiness', () => {
        it('returns 200 when the database is reachable', async () => {
            (serverService.isDatabaseReady as jest.Mock).mockResolvedValue(true)

            const req = createMockRequest() as Request
            const res = createMockResponse() as unknown as Response

            await serverController.getServerReadiness(req, res)

            expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.OK)
            expect(res.json).toHaveBeenCalledWith({ database: 'connected' })
        })

        it('returns 503 when the database is unreachable', async () => {
            (serverService.isDatabaseReady as jest.Mock).mockResolvedValue(false)

            const req = createMockRequest() as Request
            const res = createMockResponse() as unknown as Response

            await serverController.getServerReadiness(req, res)

            expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.SERVICE_UNAVAILABLE)
            expect(res.json).toHaveBeenCalledWith({ database: 'unavailable' })
        })
    })
})
