import { mkdirSync, writeFileSync } from 'fs'

import { aiConfig } from '../../config'
import { buildPromptByType } from '../../src/lib/aiInsight/prompts/insightsPrompts'
import type { AIProvider } from '../../src/services/aiProviders/AIProvider'
import { createProviderByType } from '../../src/services/aiProviders/ProviderFactory'
import type { CheckInType } from '../../src/types/data/CheckInType'
import type { InsightDecisionResult } from '../../src/types/insight'

type Scenario = {
    name: string
    decision: InsightDecisionResult
    checkIns: CheckInType[]
}

const baseCheckIns: CheckInType[] = [
    {
        id: '1',
        profileId: 'eval-profile',
        checkInDate: new Date('2026-07-27'),
        moodScore: 6,
        painLevel: 2,
        activities: ['walk', 'journaling'],
        createdAt: new Date('2026-07-27'),
        insights: []
    },
    {
        id: '2',
        profileId: 'eval-profile',
        checkInDate: new Date('2026-07-28'),
        moodScore: 5,
        painLevel: 3,
        activities: ['reading'],
        createdAt: new Date('2026-07-28'),
        insights: []
    },
    {
        id: '3',
        profileId: 'eval-profile',
        checkInDate: new Date('2026-07-29'),
        moodScore: 3,
        painLevel: 4,
        activities: [],
        createdAt: new Date('2026-07-29'),
        insights: []
    }
]

const scenarios: Scenario[] = [
    {
        name: 'mood-drop-alert',
        decision: {
            type: 'MOOD_DROP_ALERT',
            reason: 'mood declined 3 check-ins in a row',
            metadata: { moodTrend: [6, 5, 3] }
        },
        checkIns: baseCheckIns
    },
    {
        name: 'motivational',
        decision: {
            type: 'MOTIVATIONAL',
            reason: 'streak milestone',
            metadata: { currentStreak: 7 }
        },
        checkIns: baseCheckIns
    },
    {
        name: 'weekly-summary',
        decision: {
            type: 'WEEKLY_SUMMARY',
            reason: 'end of week',
            metadata: { currentStreak: 7, checkInCount: 7 }
        },
        checkIns: baseCheckIns
    }
]

type Candidate = {
    id: string
    apiKey: string
    build: () => AIProvider
}

const candidateProviders: Candidate[] = [
    {
        id: 'google',
        apiKey: aiConfig.googleApiKey,
        build: () => createProviderByType('google')
    },
    {
        id: 'google-pro',
        apiKey: aiConfig.googleApiKey,
        build: () => createProviderByType('google-pro')
    },
    {
        id: 'openai',
        apiKey: aiConfig.openaiApiKey,
        build: () => createProviderByType('openai')
    },
    {
        id: 'anthropic',
        apiKey: aiConfig.anthropicApiKey,
        build: () => createProviderByType('anthropic')
    }
]

const shuffle = <T,>(items: T[]): T[] => {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
}

const labelFor = (index: number): string => `model-${index + 1}`

const run = async (): Promise<void> => {
    const active = candidateProviders.filter(p => p.apiKey)
    const skipped = candidateProviders.filter(p => !p.apiKey).map(p => p.id)

    if (skipped.length > 0) {
        console.warn(`Skipping providers with no API key configured: ${skipped.join(', ')}`)
    }

    mkdirSync('eval-output', { recursive: true })

    const mapping: Record<string, Record<string, string>> = {}
    const judgeSections: string[] = []

    for (const scenario of scenarios) {
        const prompt = buildPromptByType(
            scenario.decision.type,
            scenario.checkIns,
            'en',
            scenario.decision.metadata
        )

        const order = shuffle(active)
        mapping[scenario.name] = {}

        const outputs = await Promise.all(order.map(async (provider, index) => {
            const label = labelFor(index)
            mapping[scenario.name][label] = provider.id
            try {
                const instance = provider.build()
                const result = await instance.generateContent({ prompt })
                return `**${label}:**\n${result.content.trim()}`
            } catch (error) {
                const msg = error instanceof Error ? error.message : 'unknown error'
                return `**${label}:** [ERROR generating content: ${msg}]`
            }
        }))

        judgeSections.push(
            `## Scenario: ${scenario.name}\n\n`
            + `Prompt sent to each model:\n\`\`\`\n${prompt}\n\`\`\`\n\n`
            + outputs.join('\n\n')
        )
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    const judgeDoc = `# AI Insight Output Evaluation

Background: Pulse is a recovery/wellness app. These outputs are AI-generated "insight" messages
shown to users after check-ins (mood drop alert, motivational nudge, weekly summary). Judge for:
tone (calm, supportive, non-clinical), adherence to length/format constraints, specificity to the
given data (not generic filler), and overall fit for a recovery-support product. Models are
anonymized as model-1/model-2/... — do not guess which is which.

For each scenario, rank the models best to worst and give a one-line reason per scenario.

${judgeSections.join('\n\n---\n\n')}
`

    const mappingJson = JSON.stringify(
        mapping,
        null,
        4
    )

    writeFileSync(`eval-output/judge-prompt-${timestamp}.md`, judgeDoc)
    writeFileSync(`eval-output/mapping-${timestamp}.json`, mappingJson)

    console.info(`Wrote eval-output/judge-prompt-${timestamp}.md (share with judges)`)
    console.info(`Wrote eval-output/mapping-${timestamp}.json (keep secret until scoring done)`)
}

run().catch((error) => {
    console.error(error)
    throw error
})
