import Csrf from 'csrf'
import supertest from 'supertest'

import { serverConfig } from '../../../config'
import App from '../../app'
import { HttpStatusCodes } from '../../constants/httpStatusCodes'
import { createToken } from '../../lib/authCrypto'
import Prisma from '../../utils/prismaClient'

const SIGNUP_URL = `/api/${serverConfig.apiVersion}/auth/signup`
const GOALS_URL = `/api/${serverConfig.apiVersion}/recovery-goals`

const csrfLib = new Csrf()

const testUser = {
    firstName: 'RecoveryGoal',
    lastName: 'Tester',
    email: 'recoverygoal-test@test.com',
    password: 'Password123!'
}

const otherUser = {
    firstName: 'Other',
    lastName: 'Tester',
    email: 'recoverygoal-other@test.com',
    password: 'Password123!'
}

const validGoal = {
    title: 'Walk daily',
    description: 'Walk 30 minutes every day',
    category: 'physical'
}

const buildCsrfHeaders = (token: string) => {
    const csrfSecret = csrfLib.secretSync()
    const csrfToken = csrfLib.create(csrfSecret)
    return {
        cookies: [`accessToken=${token}`, `_csrf=${csrfSecret}`],
        csrfToken
    }
}

const setupUser = async (user: typeof testUser = testUser) => {
    await supertest(App).post(SIGNUP_URL).send(user)
    const dbUser = await Prisma.user.findUnique({
        where: { email: user.email }
    })
    return { token: createToken(dbUser!), dbUser: dbUser! }
}

const createGoal = async (token: string, body = validGoal) => {
    const { cookies, csrfToken } = buildCsrfHeaders(token)
    return supertest(App)
        .post(GOALS_URL)
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send(body)
}

describe('Recovery Goal Routes — Integration', () => {
    describe('POST /recovery-goals', () => {
        it('creates a goal and returns 201', async () => {
            const { token } = await setupUser()

            const res = await createGoal(token)

            expect(res.status).toBe(HttpStatusCodes.CREATED)
            expect(res.body.data.title).toBe(validGoal.title)
            expect(res.body.data).toHaveProperty('id')
        })

        it('returns 401 without authentication', async () => {
            const res = await supertest(App)
                .post(GOALS_URL)
                .send(validGoal)

            expect(res.status).toBe(HttpStatusCodes.UNAUTHORIZED)
        })

        it('returns 400 for invalid body (missing category)', async () => {
            const { token } = await setupUser()
            const { cookies, csrfToken } = buildCsrfHeaders(token)

            const res = await supertest(App)
                .post(GOALS_URL)
                .set('Cookie', cookies)
                .set('x-csrf-token', csrfToken)
                .send({ title: validGoal.title })

            expect(res.status).toBe(HttpStatusCodes.BAD_REQUEST)
        })
    })

    describe('GET /recovery-goals', () => {
        it('returns list of goals for the authenticated user', async () => {
            const { token } = await setupUser()
            await createGoal(token)

            const res = await supertest(App)
                .get(GOALS_URL)
                .set('Cookie', [`accessToken=${token}`])

            expect(res.status).toBe(HttpStatusCodes.OK)
            expect(Array.isArray(res.body.data)).toBe(true)
            expect(res.body.data).toHaveLength(1)
        })

        it('returns 401 without authentication', async () => {
            const res = await supertest(App).get(GOALS_URL)
            expect(res.status).toBe(HttpStatusCodes.UNAUTHORIZED)
        })
    })

    describe('GET /recovery-goals/:goalId', () => {
        it('returns a single goal with milestones', async () => {
            const { token } = await setupUser()
            const createRes = await createGoal(token)
            const goalId = createRes.body.data.id

            const res = await supertest(App)
                .get(`${GOALS_URL}/${goalId}`)
                .set('Cookie', [`accessToken=${token}`])

            expect(res.status).toBe(HttpStatusCodes.OK)
            expect(res.body.data.goal.id).toBe(goalId)
        })

        it('returns 404 for missing goal', async () => {
            const { token } = await setupUser()

            const res = await supertest(App)
                .get(`${GOALS_URL}/non-existent-id`)
                .set('Cookie', [`accessToken=${token}`])

            expect(res.status).toBe(HttpStatusCodes.NOT_FOUND)
        })

        it('returns 404 when the goal belongs to a different user', async () => {
            const { token } = await setupUser()
            const createRes = await createGoal(token)
            const goalId = createRes.body.data.id

            const { token: otherToken } = await setupUser(otherUser)

            const res = await supertest(App)
                .get(`${GOALS_URL}/${goalId}`)
                .set('Cookie', [`accessToken=${otherToken}`])

            expect(res.status).toBe(HttpStatusCodes.NOT_FOUND)
        })

        it('returns 401 without authentication', async () => {
            const { token } = await setupUser()
            const createRes = await createGoal(token)
            const goalId = createRes.body.data.id

            const res = await supertest(App).get(`${GOALS_URL}/${goalId}`)

            expect(res.status).toBe(HttpStatusCodes.UNAUTHORIZED)
        })
    })

    describe('PATCH /recovery-goals/:goalId', () => {
        it('updates the goal and returns 200', async () => {
            const { token } = await setupUser()
            const createRes = await createGoal(token)
            const goalId = createRes.body.data.id

            const { cookies, csrfToken } = buildCsrfHeaders(token)
            const res = await supertest(App)
                .patch(`${GOALS_URL}/${goalId}`)
                .set('Cookie', cookies)
                .set('x-csrf-token', csrfToken)
                .send({ title: 'Updated goal title' })

            expect(res.status).toBe(HttpStatusCodes.OK)
            expect(res.body.data.title).toBe('Updated goal title')
        })

        it('returns 404 when the goal belongs to a different user', async () => {
            const { token } = await setupUser()
            const createRes = await createGoal(token)
            const goalId = createRes.body.data.id

            const { token: otherToken } = await setupUser(otherUser)
            const { cookies, csrfToken } = buildCsrfHeaders(otherToken)

            const res = await supertest(App)
                .patch(`${GOALS_URL}/${goalId}`)
                .set('Cookie', cookies)
                .set('x-csrf-token', csrfToken)
                .send({ title: 'Hijacked title' })

            expect(res.status).toBe(HttpStatusCodes.NOT_FOUND)
        })

        it('returns 401 without authentication', async () => {
            const { token } = await setupUser()
            const createRes = await createGoal(token)
            const goalId = createRes.body.data.id

            const res = await supertest(App)
                .patch(`${GOALS_URL}/${goalId}`)
                .send({ title: 'Updated goal title' })

            expect(res.status).toBe(HttpStatusCodes.UNAUTHORIZED)
        })
    })

    describe('DELETE /recovery-goals/:goalId', () => {
        it('deletes the goal and returns 200', async () => {
            const { token } = await setupUser()
            const createRes = await createGoal(token)
            const goalId = createRes.body.data.id

            const { cookies, csrfToken } = buildCsrfHeaders(token)
            const res = await supertest(App)
                .delete(`${GOALS_URL}/${goalId}`)
                .set('Cookie', cookies)
                .set('x-csrf-token', csrfToken)

            expect(res.status).toBe(HttpStatusCodes.OK)

            const getRes = await supertest(App)
                .get(`${GOALS_URL}/${goalId}`)
                .set('Cookie', [`accessToken=${token}`])
            expect(getRes.status).toBe(HttpStatusCodes.NOT_FOUND)
        })

        it('returns 404 when the goal belongs to a different user', async () => {
            const { token } = await setupUser()
            const createRes = await createGoal(token)
            const goalId = createRes.body.data.id

            const { token: otherToken } = await setupUser(otherUser)
            const { cookies, csrfToken } = buildCsrfHeaders(otherToken)

            const res = await supertest(App)
                .delete(`${GOALS_URL}/${goalId}`)
                .set('Cookie', cookies)
                .set('x-csrf-token', csrfToken)

            expect(res.status).toBe(HttpStatusCodes.NOT_FOUND)
        })

        it('returns 401 without authentication', async () => {
            const { token } = await setupUser()
            const createRes = await createGoal(token)
            const goalId = createRes.body.data.id

            const res = await supertest(App).delete(`${GOALS_URL}/${goalId}`)

            expect(res.status).toBe(HttpStatusCodes.UNAUTHORIZED)
        })
    })
})
