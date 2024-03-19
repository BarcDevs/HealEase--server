import supertest from 'supertest'
import { PrismaClient } from '@prisma/client'
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended'
import App from '../app'

import prisma from '../utils/PrismaClient'
import { UserType } from '../types/UserType'
import { createToken, hashPassword } from '../services/auth'

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>
jest.mock('../utils/PrismaClient', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}))
jest.mock('../utils/emailSender', () => ({
    __esModule: true,
    sendEmail: jest.fn(),
}))

beforeEach(() => {
    mockReset(prismaMock)
})

describe('Given authController', () => {
    describe('Given signup route', () => {
        it('Should return status 201 and user data', async () => {
            const newUserData = {
                name: 'test',
                email: 'test@test.com',
                password: '12345678',
            }
            const res = await supertest(App)
                .post('/api/v1/auth/signup')
                .send(newUserData)
            expect(res.status).toBe(201)

            expect(res.body.message).toBe('User created!')
            expect(res.body.data).toStrictEqual({})
        })
        it('Should return status 403 and error message and property', async () => {
            const newUsers = [
                {
                    email: 'test@test.com',
                    password: '12345678',
                },
                {
                    name: 'test',
                    password: '12345678',
                },
                {
                    name: 'test',
                    email: 'test@test.com',
                },
            ]

            newUsers.forEach((newUserData) => {
                Promise.all([
                    supertest(App)
                        .post('/api/v1/auth/signup')
                        .send(newUserData),
                ]).then(([response]) => {
                    expect(response.status).toBe(403)

                    const errorMessage = response.body.error[0]
                    expect(errorMessage.statusType).toBe('Validation Error')
                    expect(errorMessage.error).toContain('is required')
                    expect(errorMessage.property).not.toBeNull()
                })
            })
        })
        it('Should return status 409 and error message and property', async () => {
            const userData = {
                name: 'test',
                email: 'test@test.com',
                password: '12345678',
            }

            // Mock the Prisma Client's user.create method to throw an error
            prismaMock.user.findFirst.mockResolvedValue({
                id: '1',
                name: 'test',
                email: 'test@test.com',
                password: '12345678',
            } as UserType)

            // Send a request to the signup route
            const response = await supertest(App)
                .post('/api/v1/auth/signup')
                .send(userData)

            // Expect a 409 status code
            expect(response.status).toBe(409)

            const errorMessage = response.body.error[0]

            expect(errorMessage.statusType).toBe('Conflict')
            expect(errorMessage.error).toBe('User already exists!')
            expect(errorMessage.property).toBe('email')
        })
    })
    describe('Given login route', () => {
        it('should return status 200 and user data', async () => {
            const req = {
                email: 'test@test.com',
                password: '12345678',
            } as unknown as Request

            // Mock the Prisma Client's user.create method to throw an error
            prismaMock.user.findFirst.mockResolvedValue({
                id: '1',
                name: 'test',
                email: 'test@test.com',
                password: hashPassword('12345678'),
            } as UserType)

            const res = await supertest(App).get('/api/v1/auth/login').send(req)
            expect(res.status).toBe(200)
            expect(res.body.message).toBe('user logged in!')
            expect(res.body.data).toHaveProperty('token')
            expect(res.headers['set-cookie']).not.toBeNull()
            expect(res.headers['set-cookie'][0]).toContain('accessToken')
        })
        it('should return status 404 and error message', async () => {
            const newUserData = {
                email: 'test@test.com',
                password: '12345678',
            }

            const res = await supertest(App)
                .get('/api/v1/auth/login')
                .send(newUserData)
            expect(res.status).toBe(404)

            const errorMessage = res.body.error[0]

            expect(errorMessage.statusType).toBe('Authentication Error')
            expect(errorMessage.error).toBe('User not found!')
        })
        it('should return status 403 and error message and property', async () => {
            const newUsers = [
                {
                    name: 'test',
                    email: 'test@test.com',
                    password: '12345678',
                },
                {
                    password: '12345678',
                },
                {
                    email: 'test@test.com',
                },
            ]

            newUsers.forEach((newUserData) => {
                Promise.all([
                    supertest(App).get('/api/v1/auth/login').send(newUserData),
                ]).then(([response]) => {
                    expect(response.status).toBe(403)

                    const errorMessage = response.body.error[0]

                    expect(errorMessage.statusType).toBe('Validation Error')
                    expect(errorMessage.error).toEqual(
                        expect.stringMatching(/is required|is not allowed/),
                    )
                    expect(errorMessage.property).not.toBeNull()
                })
            })
        })
    })
    describe('Given logout route', () => {
        it('should return status 200 and clear accessToken cookie', async () => {
            const res = await supertest(App).get('/api/v1/auth/logout')

            expect(res.status).toBe(200)
            expect(res.body.message).toBe('user logged out!')
            expect(res.headers['set-cookie'][0]).not.toHaveProperty(
                'accessToken',
            )
        })
    })
    describe('Given me route', () => {
        it('should return status 200 and user data', async () => {
            const userData = {
                id: 'fd9e8170-e542-4299-85ce-fb53a4d66ed6',
                name: 'Yoad',
                email: 'yoad23@gmail.com',
                password: hashPassword('12345678'),
            } as UserType

            prismaMock.user.findUnique.mockResolvedValue(userData)

            const mockToken = createToken(userData)

            const res = await supertest(App)
                .get('/api/v1/auth/me')
                .set('Cookie', [`accessToken=${mockToken}`])

            expect(res.status).toBe(200)
            expect(res.body.message).toBe('User info!')
            expect(res.body.data).toHaveProperty('user')
            expect(res.body.data.user.id).toBe(userData.id)
            expect(res.body.data.user.email).toBe(userData.email)
        })
        it('should return status 401 and error message', async () => {
            const tokens = [
                '',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZkOWU4MTcwLWU1NDItNDI5OS04NWNlLWZiNTNhNGQ2NmVkNiIsImVtYWlsIjoieW9hZDIzQGdtYWlsLmNvbSIsImlhdCI6MTcxMDA5MzI4NCwiZXhwIjoxNzEwMDk2ODg0fQ.ESouPcSLrXPGWghmmcYcW9fOOADcWfayrGKEB1MBj5I',
            ]

            tokens.forEach((token) => {
                Promise.all([
                    supertest(App)
                        .get('/api/v1/auth/me')
                        .set('Cookie', [`accessToken=${token}`]),
                ]).then(([response]) => {
                    expect(response.status).toBe(401)
                    const errorMessage = response.body.error[0]

                    expect(errorMessage.statusType).toBe('Unauthorized')
                    expect(errorMessage.error).toBe('User not authenticated!')

                    expect(
                        response.headers['set-cookie'][0],
                    ).not.toHaveProperty('accessToken')
                })
            })
        })
    })
    describe('Given forget password route', () => {
        it('should return status 200 and message', async () => {
            const emails = ['test@test.com', 'test@test.net']

            emails.forEach((email) => {
                Promise.all([
                    supertest(App).get(`/api/v1/auth/forget-password/${email}`),
                ]).then(([response]) => {
                    expect(response.status).toBe(200)
                    expect(response.body.message).toBe(
                        'We have sent you an email with an OTP to confirm your email! Please check your email.',
                    )
                })
            })
        })
        it('should return status 403 and error message and property', () => {
            const emails = ['test@test.co.il', 'test@test.outlook', 'test@test']

            emails.forEach((email) => {
                Promise.all([
                    supertest(App).get(`/api/v1/auth/forget-password/${email}`),
                ]).then(([response]) => {
                    expect(response.status).toBe(403)
                    const errorMessage = response.body.error[0]

                    expect(errorMessage.statusType).toBe('Validation Error')
                    expect(errorMessage.error).toEqual(
                        expect.stringMatching(
                            /must be a valid email|is not allowed/,
                        ),
                    )
                    expect(errorMessage.property).not.toBeNull()
                })
            })
        })
    })
    describe('Given confirm email route', () => {
        it('should return status 200 and message', async () => {
            const req = {
                OTP: 123456,
                email: 'test@test.com',
            } as unknown as Request

            const userData = {
                id: '1',
                name: 'test',
                email: 'test@test.com',
                imageUrl: null,
                password: hashPassword('12345678'),
                resetPasswordOTP: 123456,
                resetPasswordExpiration: new Date(
                    Date.now() + 1000 * 60 * 60 * 24,
                ), // 1 day
                password_updated_at: null,
                created_at: new Date(Date.now()),
                updated_at: new Date(Date.now()),
            } as UserType

            prismaMock.user.findFirst.mockResolvedValue(userData)

            const res = await supertest(App)
                .post('/api/v1/auth/confirm-email')
                .send(req)

            expect(res.status).toBe(201)
            expect(res.body.message).toBe('Your email is confirmed!')
            expect(res.body.data).toHaveProperty('user')
            expect(res.body.data.user.id).toBe(userData.id)
        })
        it('should return status 403 and error message and property', () => {
            const reqArray = [
                {
                    OTP: '123456',
                    email: 'test@test.com',
                },
                {
                    OTP: '123456',
                    email: 'test@test.co.il',
                },
                {
                    OTP: 123456,
                },
                {
                    email: 'test@test.net',
                },
                {
                    OTP: 123456,
                    email: 'test@test.com',
                },
            ]

            const userData = {
                id: '1',
                name: 'test',
                email: 'test@test.com',
                imageUrl: null,
                password: hashPassword('12345678'),
                resetPasswordOTP: 246810,
                resetPasswordExpiration: new Date(
                    Date.now() + 1000 * 60 * 60 * 24,
                ), // 1 day
                password_updated_at: null,
                created_at: new Date(Date.now()),
                updated_at: new Date(Date.now()),
            } as UserType

            prismaMock.user.findFirst.mockResolvedValue(userData)

            reqArray.forEach((req) => {
                Promise.all([
                    supertest(App).post('/api/v1/auth/confirm-email').send(req),
                ]).then(([response]) => {
                    expect(response.status).toBe(403)
                    const errorMessage = response.body.error[0]

                    expect(errorMessage.statusType).toBe('Validation Error')
                    expect(errorMessage.error).toEqual(
                        expect.stringMatching(
                            /must be a valid email|is not allowed|is required|OTP is not valid!/,
                        ),
                    )
                    expect(errorMessage.property).not.toBeNull()
                })
            })
        })
    })
    describe('Given reset password route', () => {
        it('should return status 200 and message and reset user password', async () => {
            const req = {
                email: 'test@test.com',
                newPassword: '208389403',
                userOTP: 123457,
            }

            const userData = {
                id: '1',
                name: 'test',
                email: 'test@test.com',
                imageUrl: null,
                password: hashPassword('12345678'),
                resetPasswordOTP: 123457,
                resetPasswordExpiration: new Date(
                    Date.now() + 1000 * 60 * 60 * 24,
                ), // 1 day
                password_updated_at: null,
                created_at: new Date(Date.now()),
                updated_at: new Date(Date.now()),
            } as UserType

            prismaMock.user.findFirst.mockResolvedValue(userData)

            prismaMock.user.update.mockResolvedValue({
                ...userData,
                password: hashPassword(req.newPassword),
                resetPasswordOTP: null,
                resetPasswordExpiration: null,
                password_updated_at: new Date(Date.now()),
            })

            const res = await supertest(App)
                .put('/api/v1/auth/reset-password')
                .send(req)

            expect(res.status).toBe(200)
            expect(res.body.message).toBe('Password changed successfully!')
            expect(res.body.data).toHaveProperty('user')
            expect(res.body.data.user.id).toBe(userData.id)
        })
        it('should return status 404', async () => {
            const req = {
                email: 'test@test.com',
                newPassword: '208389403',
                userOTP: 123456,
            }

            const userData = {
                id: '1',
                name: 'test',
                email: 'test@test.com',
                imageUrl: null,
                password: hashPassword('12345678'),
                resetPasswordOTP: 123458,
                resetPasswordExpiration: new Date(
                    Date.now() + 1000 * 60 * 60 * 24,
                ), // 1 day
                password_updated_at: null,
                created_at: new Date(Date.now()),
                updated_at: new Date(Date.now()),
            } as UserType

            prismaMock.user.findFirst.mockResolvedValue(userData)

            const res = await supertest(App)
                .put('/api/v1/auth/reset-password')
                .send(req)

            expect(res.status).toBe(404)
            expect(res.body.error[0].error).toBe(
                'There is an error occurred! Please try again.',
            )
            expect(res.body.error[0].statusType).toBe('Reset Password')
            expect(res.body.error[0].property).toBeUndefined()
        })
        it('should return status 403 and error message', () => {
            const reqArray = [
                {
                    email: 'test@test.co.il',
                    newPassword: '208389403',
                    userOTP: 123456,
                },
                {
                    email: 'test@test.com',
                    userOTP: 123456,
                },
                {
                    email: 'test@test.com',
                    newPassword: '208389403',
                },
                {
                    newPassword: '208389403',
                    userOTP: 123456,
                },
                {
                    name: 'test',
                    email: 'test@test.com',
                    newPassword: '208389403',
                    userOTP: 123456,
                },
            ]

            const userData = {
                id: '1',
                name: 'test',
                email: 'test@test.com',
                imageUrl: null,
                password: hashPassword('12345678'),
                resetPasswordOTP: 123458,
                resetPasswordExpiration: new Date(
                    Date.now() + 1000 * 60 * 60 * 24,
                ), // 1 day
                password_updated_at: null,
                created_at: new Date(Date.now()),
                updated_at: new Date(Date.now()),
            } as UserType

            prismaMock.user.findFirst.mockResolvedValue(userData)

            reqArray.forEach((req) => {
                Promise.all([
                    supertest(App).put('/api/v1/auth/reset-password').send(req),
                ]).then(([response]) => {
                    expect(response.status).toBe(403)

                    const errorMessage = response.body.error[0]

                    expect(errorMessage.error).toEqual(
                        expect.stringMatching(
                            /must be a valid email|is not allowed|is required/,
                        ),
                    )
                    expect(errorMessage.statusType).toBe('Validation Error')
                    expect(errorMessage.property).not.toBeNull()
                })
            })
        })
    })

    afterEach(async () => {
        jest.clearAllMocks()
    })

    afterAll(async () => {
        await prismaMock.$disconnect()
    })
})
