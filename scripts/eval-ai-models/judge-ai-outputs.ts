import {
    readdirSync,
    readFileSync,
    writeFileSync
} from 'fs'

import { aiGenerationConfig } from '../../config'
import type { AIProvider } from '../../src/services/aiProviders/AIProvider'
import { createProviderByType } from '../../src/services/aiProviders/ProviderFactory'

// Judging output is longer than a single insight (ranking + notes across
// 3 scenarios, each with 4 candidate models), so the shared token budget
// is raised for this script only.
aiGenerationConfig.maxOutputTokens = 4000

type ScenarioVerdict = {
    ranking: string[]
    notes: string
}

type JudgeVerdict = Record<string, ScenarioVerdict>

const latestFile = (prefix: string): string => {
    const files = readdirSync('eval-output')
        .filter(f => f.startsWith(prefix))
        .sort()
    const last = files[files.length - 1]
    if (!last) {
        throw new Error(`No files found matching ${prefix}*`)
    }
    return `eval-output/${last}`
}

const judges: Array<{ id: string, build: () => AIProvider }> = [
    { id: 'openai', build: () => createProviderByType('openai') },
    { id: 'anthropic', build: () => createProviderByType('anthropic') },
    { id: 'google-pro', build: () => createProviderByType('google-pro') }
]

const judgingInstruction = `
You are an impartial judge. Above is a set of AI-generated outputs for several scenarios,
labeled model-1, model-2, etc. Rank the models best-to-worst for EACH scenario.

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON, in this exact shape:
{
  "<scenario-name>": {
    "ranking": ["model-x", "model-y", "model-z", "model-w"],
    "notes": "one sentence explaining the ranking"
  }
}
`

const parseVerdict = (raw: string): JudgeVerdict => {
    const cleaned = raw
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/```\s*$/, '')
    return JSON.parse(cleaned) as JudgeVerdict
}

const run = async (): Promise<void> => {
    const judgeDocPath = latestFile('judge-prompt-')
    const mappingPath = latestFile('mapping-')

    const judgeDoc = readFileSync(judgeDocPath, 'utf-8')
    const mapping = JSON.parse(readFileSync(mappingPath, 'utf-8')) as Record<string, Record<string, string>>

    console.info(`Judging: ${judgeDocPath}`)

    const fullPrompt = `${judgeDoc}\n\n${judgingInstruction}`

    const verdicts: Record<string, JudgeVerdict> = {}

    for (const judge of judges) {
        try {
            const provider = judge.build()
            const result = await provider.generateContent({ prompt: fullPrompt })
            verdicts[judge.id] = parseVerdict(result.content)
            console.info(`${judge.id}: verdict received`)
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'unknown error'
            console.error(`${judge.id} judging failed: ${msg}`)
        }
    }

    const scenarioNames = Object.keys(mapping)
    const reportLines: string[] = ['# Aggregated AI-as-Judge Results\n']

    for (const scenario of scenarioNames) {
        reportLines.push(`## ${scenario}\n`)

        const scores: Record<string, number> = {}
        const voters: Record<string, number> = {}

        for (const [judgeId, verdict] of Object.entries(verdicts)) {
            const scenarioVerdict = verdict[scenario]
            if (!scenarioVerdict) continue

            reportLines.push(
                `- **${judgeId}** ranked: ${scenarioVerdict.ranking.map(label => mapping[scenario][label] || label).join(' > ')} - _${scenarioVerdict.notes}_`
            )

            scenarioVerdict.ranking.forEach((label, index) => {
                const realModel = mapping[scenario][label] || label
                const points = scenarioVerdict.ranking.length - index
                scores[realModel] = (scores[realModel] || 0) + points
                voters[realModel] = (voters[realModel] || 0) + 1
            })
        }

        const ranked = Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .map(([model, points]) => `${model} (${points} pts across ${voters[model]} judge${voters[model] === 1 ? '' : 's'})`)

        reportLines.push(`\n**Aggregate ranking:** ${ranked.join(' > ')}\n`)
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const outPath = `eval-output/aggregated-judgment-${timestamp}.md`
    writeFileSync(outPath, reportLines.join('\n'))
    console.info(`Wrote ${outPath}`)
}

run().catch((error) => {
    console.error(error)
    throw error
})
