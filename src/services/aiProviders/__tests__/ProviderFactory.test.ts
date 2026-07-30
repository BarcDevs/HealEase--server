import { createProviderByType } from '../ProviderFactory'

jest.mock('../../../../config', () => ({
    aiConfig: {
        provider: 'google',
        googleModel: 'gemini-3.1-flash-lite',
        googleProModel: 'gemini-3.1-pro-preview',
        anthropicModel: 'claude-sonnet-5',
        openaiModel: 'gpt-5.6-sol',
        googleApiKey: 'test-google-key',
        openaiApiKey: 'test-openai-key',
        anthropicApiKey: 'test-anthropic-key'
    },
    aiGenerationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7
    },
    loggingConfig: { dir: 'logs' }
}))

describe('createProviderByType', () => {
    let fetchMock: jest.Mock

    beforeEach(() => {
        fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        finishReason: 'STOP',
                        content: { parts: [{ text: 'ok' }] }
                    }
                ]
            })
        })
        global.fetch = fetchMock as any
    })

    it('google hits the lite model endpoint', async () => {
        const provider = createProviderByType('google')
        await provider.generateContent({ prompt: 'hi' })

        const calledUrl = fetchMock.mock.calls[0][0] as string
        expect(calledUrl).toContain('/models/gemini-3.1-flash-lite:generateContent')
    })

    it('google-pro actually hits the pro model endpoint, not the lite one', async () => {
        const provider = createProviderByType('google-pro')
        await provider.generateContent({ prompt: 'hi' })

        const calledUrl = fetchMock.mock.calls[0][0] as string
        expect(calledUrl).toContain('/models/gemini-3.1-pro-preview:generateContent')
        expect(calledUrl).not.toContain('gemini-3.1-flash-lite')
    })

    it('google and google-pro both authenticate with the shared google API key', async () => {
        const liteProvider = createProviderByType('google')
        const proProvider = createProviderByType('google-pro')

        await liteProvider.generateContent({ prompt: 'hi' })
        await proProvider.generateContent({ prompt: 'hi' })

        expect(fetchMock.mock.calls[0][0]).toContain('key=test-google-key')
        expect(fetchMock.mock.calls[1][0]).toContain('key=test-google-key')
    })
})
