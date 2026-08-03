import { detectLowState } from '../../../services/feedback/interventionEngine'
import { logInterventionDecision } from '../../../services/feedback/interventionLogger'
import { generateInterventionInsight } from '../../../services/feedback/interventionOrchestrator'
import { renderInterventionMessage } from '../../../services/feedback/messageRenderer'

jest.mock('../../../services/feedback/contextBuilder', () => ({
    buildInterventionContext: jest.fn().mockReturnValue({ context: 'mock' } as never)
}))

jest.mock('../../../services/feedback/interventionEngine', () => ({
    detectLowState: jest.fn()
}))

jest.mock('../../../services/feedback/interventionLogger', () => ({
    logInterventionDecision: jest.fn()
}))

jest.mock('../../../services/feedback/interventionSuppression', () => ({
    calculateInterventionMode: jest.fn().mockReturnValue('full')
}))

jest.mock('../../../services/feedback/messageRenderer', () => ({
    renderInterventionMessage: jest.fn()
}))

const mockCheckIn = {
    id: 'checkin-1',
    checkInDate: new Date('2026-01-07'),
    moodScore: 3,
    painLevel: 8,
    activities: []
}

describe('generateInterventionInsight', () => {
    it('returns null when not in low state', async () => {
        ;(detectLowState as jest.Mock).mockReturnValue({
            lowState: { isLowState: false, reasons: [], trendDuration: 0 },
            ruleResults: []
        } as never)

        const result = await generateInterventionInsight(
            'user-id',
            'checkin-id',
            mockCheckIn as any,
            [mockCheckIn] as any,
            'he'
        )

        expect(result).toBeNull()
        expect(renderInterventionMessage).not.toHaveBeenCalled()
    })

    it('renders and returns message when in low state', async () => {
        const mockMessage = { text: 'Keep going', type: 'supportive' }
        ;(detectLowState as jest.Mock).mockReturnValue({
            lowState: {
                isLowState: true,
                reasons: ['mood_drop'],
                trendDuration: 3
            },
            ruleResults: [{ triggered: true, weight: 0.8 }]
        } as never)
        ;(renderInterventionMessage as jest.Mock).mockResolvedValue(mockMessage as never)

        const result = await generateInterventionInsight(
            'user-id',
            'checkin-id',
            mockCheckIn as any,
            [mockCheckIn] as any,
            'he'
        )

        expect(renderInterventionMessage).toHaveBeenCalled()
        expect(result).toEqual(mockMessage)
    })

    it('logs decision when in low state', async () => {
        ;(detectLowState as jest.Mock).mockReturnValue({
            lowState: {
                isLowState: true,
                reasons: ['mood_drop'],
                trendDuration: 2
            },
            ruleResults: [{ triggered: true, weight: 0.5 }]
        } as never)
        ;(renderInterventionMessage as jest.Mock).mockResolvedValue({ text: 'msg' } as never)

        await generateInterventionInsight(
            'user-id',
            'checkin-id',
            mockCheckIn as any,
            [mockCheckIn] as any,
            'he'
        )

        expect(logInterventionDecision).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'user-id',
                checkInId: 'checkin-id'
            })
        )
    })

    it('does not log when not in low state', async () => {
        ;(detectLowState as jest.Mock).mockReturnValue({
            lowState: { isLowState: false, reasons: [], trendDuration: 0 },
            ruleResults: []
        } as never)

        await generateInterventionInsight(
            'user-id',
            'checkin-id',
            mockCheckIn as any,
            [mockCheckIn] as any,
            'he'
        )

        expect(logInterventionDecision).not.toHaveBeenCalled()
    })

    it('passes previousIntervention to calculateInterventionMode via createIntent', async () => {
        const { calculateInterventionMode } = require('../../../services/feedback/interventionSuppression')
        ;(detectLowState as jest.Mock).mockReturnValue({
            lowState: {
                isLowState: true,
                reasons: ['mood_drop'],
                trendDuration: 1
            },
            ruleResults: [{ triggered: true, weight: 0.3 }]
        } as never)
        ;(renderInterventionMessage as jest.Mock).mockResolvedValue({ text: 'msg' } as never)
        const prevIntervention = { id: 'prev', type: 'supportive' }

        await generateInterventionInsight(
            'user-id',
            'checkin-id',
            mockCheckIn as any,
            [mockCheckIn] as any,
            'he',
            prevIntervention as any
        )

        expect(calculateInterventionMode).toHaveBeenCalledWith(
            expect.any(Object),
            prevIntervention
        )
    })
})
