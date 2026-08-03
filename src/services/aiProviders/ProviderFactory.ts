import { aiConfig, isProd } from '../../../config'

import { type AIProvider } from './AIProvider'
import { AnthropicProvider } from './AnthropicProvider'
import { GoogleAIProvider } from './GoogleAIProvider'
import { OpenAIProvider } from './OpenAIProvider'

export type ProviderType =
    | 'google'
    | 'google-pro'
    | 'openai'
    | 'anthropic'

export const createProvider = (): AIProvider => {
    const providerType: ProviderType = (
        aiConfig.provider as ProviderType
    ) || 'google'

    return createProviderByType(providerType)
}

export const createProviderByType = (
    providerType: ProviderType
): AIProvider => {
    const apiKey = getApiKeyForProvider(providerType)

    switch (providerType) {
        case 'openai':
            return new OpenAIProvider({ apiKey })
        case 'anthropic':
            return new AnthropicProvider({ apiKey })
        case 'google-pro':
            return new GoogleAIProvider({
                apiKey,
                modelId: aiConfig.googleModel
            })
        case 'google':
        default:
            return new GoogleAIProvider({ apiKey })
    }
}

export const getApiKeyForProvider = (
    providerType: ProviderType
): string => {
    switch (providerType) {
        case 'openai':
            return aiConfig.openaiApiKey || ''
        case 'anthropic':
            return aiConfig.anthropicApiKey || ''
        case 'google-pro':
            // Pro tier is always paid, regardless of environment.
            return aiConfig.googleApiKey || ''
        case 'google':
        default:
            // Free tier isn't guaranteed availability, so dev/preview use a
            // separate key to avoid competing with prod's paid-tier quota.
            return (
                (!isProd && aiConfig.googleFreeApiKey)
                || aiConfig.googleApiKey
                || ''
            )
    }
}