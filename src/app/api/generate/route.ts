import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit'

/** Max requests per IP per minute — tune via env for different tiers */
const RATE_LIMIT_MAX = Number(process.env.AI_RATE_LIMIT_MAX ?? 10)
const RATE_LIMIT_WINDOW_MS = Number(process.env.AI_RATE_LIMIT_WINDOW_MS ?? 60_000)

const SYSTEM_PROMPT = `You are a senior Product Manager and Agile expert. Given a raw feature description, break it down into structured engineering tasks.

Return a JSON object with this exact structure:
{
  "stories": [
    {
      "title": "Clear, actionable story title",
      "description": "Technical description of what needs to be built and why",
      "acceptanceCriteria": ["criterion 1", "criterion 2", "criterion 3"],
      "storyPoints": 3,
      "priority": "high",
      "tags": ["backend", "api"]
    }
  ]
}

Rules:
- Generate 3-6 stories that fully cover the feature
- storyPoints must be one of: 1, 2, 3, 5, 8, 13 (Fibonacci)
- priority must be one of: low, medium, high, critical
- Each story must have 2-4 acceptance criteria
- Tags should be technical areas: frontend, backend, api, database, auth, email, ui, testing
- Stories should be independently deliverable
- Use engineering language in descriptions`

const MAX_INPUT_LENGTH = 2000

export async function POST(req: NextRequest) {
  // Rate limiting — applied before any parsing to minimize work per rejected request
  const identifier = getClientIdentifier(req)
  const { allowed, remaining, resetInMs } = checkRateLimit(identifier, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
          'Retry-After': String(Math.ceil(resetInMs / 1000)),
        },
      }
    )
  }

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { input } = body
    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Input is required and must be a string' }, { status: 400 })
    }
    if (input.trim().length === 0) {
      return NextResponse.json({ error: 'Input cannot be empty' }, { status: 400 })
    }
    if (input.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        { error: `Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters` },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      // Return mock data for demo when no API key
      return NextResponse.json({
        stories: [
          {
            title: 'Implement Core Feature Logic',
            description: `Build the core implementation for: ${input.slice(0, 80).trim()}`,
            acceptanceCriteria: [
              'Feature works as described',
              'Edge cases are handled',
              'Unit tests pass',
            ],
            storyPoints: 5,
            priority: 'high',
            tags: ['backend'],
          },
          {
            title: 'Build User Interface',
            description: 'Create the frontend UI components for the feature with proper UX.',
            acceptanceCriteria: [
              'UI matches design specifications',
              'Responsive on mobile and desktop',
              'Accessibility requirements met',
            ],
            storyPoints: 3,
            priority: 'high',
            tags: ['frontend', 'ui'],
          },
          {
            title: 'Integration Testing & QA',
            description: 'Write comprehensive tests and perform QA for the new feature.',
            acceptanceCriteria: [
              'E2E tests cover main user flows',
              'Performance benchmarks met',
              'No regression in existing features',
            ],
            storyPoints: 2,
            priority: 'medium',
            tags: ['testing'],
          },
        ],
      })
    }

    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: input },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('No content from OpenAI')

    const parsed = JSON.parse(content)
    return NextResponse.json(parsed, {
      headers: { 'X-RateLimit-Remaining': String(remaining) },
    })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
