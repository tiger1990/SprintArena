import { describe, it, expect, beforeEach } from 'vitest'
import { calculateSprintScores } from './engine'
import type { Sprint, Story, User, SprintResult, WorkspaceSettings } from '@/types'

// ─── Test fixtures ─────────────────────────────────────────────────────────────

const BASE_SETTINGS: WorkspaceSettings = {
  sprintDurationDays: 14,
  wipLimits: { todo: 0, inProgress: 3, review: 2 },
  scoringEnabled: true,
  adminExcludedFromScoring: true,
  definitionOfDone: 'All AC met.',
  velocityWindowSprints: 3,
}

function makeSprint(overrides: Partial<Sprint> = {}): Sprint {
  return {
    id: 'sprint-1',
    workspaceId: 'ws-1',
    name: 'Sprint 1',
    startDate: '2026-03-01T00:00:00.000Z',
    endDate: '2026-03-14T23:59:59.000Z',
    status: 'active',
    capacityPoints: 40,
    velocityPoints: 0,
    createdBy: 'admin-1',
    createdAt: '2026-03-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeUser(id: string, role: 'admin' | 'assignee' = 'assignee'): User {
  return {
    id,
    name: `User ${id}`,
    role,
    color: '#ffffff',
    timezone: 'UTC',
    isActive: true,
    workspaceId: 'ws-1',
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

function makeStory(overrides: Partial<Story> = {}): Story {
  return {
    id: `story-${Math.random().toString(36).slice(2)}`,
    workspaceId: 'ws-1',
    sprintId: 'sprint-1',
    title: 'Test story',
    description: 'Description',
    status: 'todo',
    priority: 'medium',
    storyPoints: 3,
    createdBy: 'admin-1',
    tags: [],
    orderIndex: 0,
    acceptanceCriteria: [],
    comments: [],
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    ...overrides,
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('calculateSprintScores', () => {
  const sprint = makeSprint()
  const admin = makeUser('admin-1', 'admin')
  const dev1 = makeUser('dev-1')
  const dev2 = makeUser('dev-2')
  const users = [admin, dev1, dev2]

  describe('basic scoring', () => {
    it('awards base story points for completed stories', () => {
      const stories = [
        makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 5,
          completedAt: '2026-03-14T10:00:00.000Z' }),
      ]
      const { results } = calculateSprintScores(sprint, stories, users, [], BASE_SETTINGS)
      const dev1Result = results.find(r => r.userId === 'dev-1')!
      expect(dev1Result.isEligible).toBe(true)
      expect(dev1Result.storiesCompleted).toBe(1)
      expect(dev1Result.pointsScored).toBeGreaterThan(0)
    })

    it('awards 0 points for users with no assigned stories', () => {
      const { results } = calculateSprintScores(sprint, [], users, [], BASE_SETTINGS)
      const dev1Result = results.find(r => r.userId === 'dev-1')!
      expect(dev1Result.isEligible).toBe(false)
      expect(dev1Result.pointsScored).toBe(0)
    })

    it('excludes admin users when adminExcludedFromScoring is true', () => {
      const stories = [
        makeStory({ assigneeId: 'admin-1', status: 'done', storyPoints: 5,
          completedAt: '2026-03-14T10:00:00.000Z' }),
      ]
      const { results } = calculateSprintScores(sprint, stories, users, [], BASE_SETTINGS)
      expect(results.find(r => r.userId === 'admin-1')).toBeUndefined()
    })

    it('includes admin users when adminExcludedFromScoring is false', () => {
      const settings = { ...BASE_SETTINGS, adminExcludedFromScoring: false }
      const stories = [
        makeStory({ assigneeId: 'admin-1', status: 'done', storyPoints: 5,
          completedAt: '2026-03-14T10:00:00.000Z' }),
      ]
      const { results } = calculateSprintScores(sprint, stories, users, [], settings)
      expect(results.find(r => r.userId === 'admin-1')).toBeDefined()
    })
  })

  describe('early completion multiplier', () => {
    it('applies 1.25x multiplier when story completed 2+ days early', () => {
      const earlyStory = makeStory({
        assigneeId: 'dev-1', status: 'done', storyPoints: 5,
        // Sprint ends 2026-03-14, completed 3 days early = 2026-03-11
        completedAt: '2026-03-11T10:00:00.000Z',
      })
      const lateStory = makeStory({
        assigneeId: 'dev-2', status: 'done', storyPoints: 5,
        // Completed on the last day
        completedAt: '2026-03-14T10:00:00.000Z',
      })
      const { results } = calculateSprintScores(
        sprint, [earlyStory, lateStory], users, [], BASE_SETTINGS
      )
      const dev1 = results.find(r => r.userId === 'dev-1')!
      const dev2 = results.find(r => r.userId === 'dev-2')!

      // dev1: 4pts * 1.25 = 5 + 10 clean sprint = 15
      // dev2: 4pts * 1.0 = 4 + 10 clean sprint = 14
      expect(dev1.pointsScored).toBeGreaterThan(dev2.pointsScored)
    })

    it('does not apply multiplier when completed on the last day (0 days early)', () => {
      const storyOnTime = makeStory({
        assigneeId: 'dev-1', status: 'done', storyPoints: 3,
        // Completed on the last day — 0 days early, no multiplier
        completedAt: '2026-03-14T10:00:00.000Z',
      })
      const storyEarly = makeStory({
        assigneeId: 'dev-2', status: 'done', storyPoints: 3,
        // Completed 4 days early — clearly qualifies
        completedAt: '2026-03-10T10:00:00.000Z',
      })
      const { results } = calculateSprintScores(
        sprint, [storyOnTime, storyEarly], users, [], BASE_SETTINGS
      )
      const dev1 = results.find(r => r.userId === 'dev-1')!
      const dev2 = results.find(r => r.userId === 'dev-2')!
      expect(dev1.pointsScored).toBeLessThan(dev2.pointsScored)
    })
  })

  describe('clean sprint bonus', () => {
    it('awards +10 clean sprint bonus when user has zero spills', () => {
      const story = makeStory({
        assigneeId: 'dev-1', status: 'done', storyPoints: 5,
        completedAt: '2026-03-14T10:00:00.000Z',
      })
      const { results } = calculateSprintScores(sprint, [story], users, [], BASE_SETTINGS)
      const dev1 = results.find(r => r.userId === 'dev-1')!
      expect(dev1.bonusPoints).toBeGreaterThanOrEqual(10)
    })

    it('does not award clean sprint bonus when user has spills', () => {
      const done = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 5,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const spilled = makeStory({ assigneeId: 'dev-1', status: 'spilled', storyPoints: 3 })
      const { results } = calculateSprintScores(sprint, [done, spilled], users, [], BASE_SETTINGS)
      const dev1 = results.find(r => r.userId === 'dev-1')!
      // clean sprint bonus = 0 since spilled.length > 0
      expect(dev1.bonusPoints).toBeLessThan(10)
    })
  })

  describe('critical story bonus', () => {
    it('awards +5 for each completed critical story', () => {
      const critical = makeStory({
        assigneeId: 'dev-1', status: 'done', priority: 'critical', storyPoints: 3,
        completedAt: '2026-03-14T10:00:00.000Z',
      })
      const normal = makeStory({
        assigneeId: 'dev-2', status: 'done', priority: 'medium', storyPoints: 3,
        completedAt: '2026-03-14T10:00:00.000Z',
      })
      const { results } = calculateSprintScores(
        sprint, [critical, normal], users, [], BASE_SETTINGS
      )
      const dev1 = results.find(r => r.userId === 'dev-1')!
      const dev2 = results.find(r => r.userId === 'dev-2')!
      expect(dev1.bonusPoints - dev2.bonusPoints).toBe(5)
    })
  })

  describe('spill penalties', () => {
    it('deducts 2 points per spilled story without a blocker comment', () => {
      const done = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 8,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const spilledNoBlocker = makeStory({
        assigneeId: 'dev-1', status: 'spilled', storyPoints: 3, comments: [],
      })
      const { results } = calculateSprintScores(
        sprint, [done, spilledNoBlocker], users, [], BASE_SETTINGS
      )
      const dev1 = results.find(r => r.userId === 'dev-1')!
      expect(dev1.penaltyPoints).toBe(2)
    })

    it('waives spill penalty when story has a blocker comment', () => {
      const done = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 8,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const spilledWithBlocker = makeStory({
        assigneeId: 'dev-1', status: 'spilled', storyPoints: 3,
        comments: [{ id: 'c1', storyId: 'x', userId: 'dev-1', body: 'Blocked!', isBlocker: true,
          createdAt: '2026-03-10T00:00:00.000Z' }],
      })
      const { results } = calculateSprintScores(
        sprint, [done, spilledWithBlocker], users, [], BASE_SETTINGS
      )
      const dev1 = results.find(r => r.userId === 'dev-1')!
      expect(dev1.penaltyPoints).toBe(0)
    })
  })

  describe('ranking and winner selection', () => {
    it('ranks users by points descending', () => {
      const s1 = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 8,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const s2 = makeStory({ assigneeId: 'dev-2', status: 'done', storyPoints: 3,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const { results } = calculateSprintScores(sprint, [s1, s2], users, [], BASE_SETTINGS)
      const r1 = results.find(r => r.userId === 'dev-1')!
      const r2 = results.find(r => r.userId === 'dev-2')!
      expect(r1.rank).toBe(1)
      expect(r2.rank).toBe(2)
    })

    it('marks the top scorer as winner', () => {
      const s1 = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 8,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const s2 = makeStory({ assigneeId: 'dev-2', status: 'done', storyPoints: 3,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const { results } = calculateSprintScores(sprint, [s1, s2], users, [], BASE_SETTINGS)
      expect(results.find(r => r.userId === 'dev-1')!.isWinner).toBe(true)
      expect(results.find(r => r.userId === 'dev-2')!.isWinner).toBe(false)
    })

    it('marks multiple users as winners on exact point tie', () => {
      const s1 = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 5,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const s2 = makeStory({ assigneeId: 'dev-2', status: 'done', storyPoints: 5,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const { results } = calculateSprintScores(sprint, [s1, s2], users, [], BASE_SETTINGS)
      const winners = results.filter(r => r.isWinner)
      expect(winners.length).toBe(2)
    })

    it('does not mark anyone winner if top score is 0', () => {
      const spilled = makeStory({ assigneeId: 'dev-1', status: 'spilled', storyPoints: 5 })
      const { results } = calculateSprintScores(sprint, [spilled], users, [], BASE_SETTINGS)
      expect(results.filter(r => r.isWinner).length).toBe(0)
    })
  })

  describe('exclusions', () => {
    it('excludes explicitly excluded users from scoring', () => {
      const story = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 5,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const exclusion = { id: 'ex-1', sprintId: 'sprint-1', userId: 'dev-1', reason: 'Leave', addedBy: 'admin-1' }
      const { results } = calculateSprintScores(sprint, [story], users, [exclusion], BASE_SETTINGS)
      expect(results.find(r => r.userId === 'dev-1')).toBeUndefined()
    })
  })

  describe('badge awards', () => {
    it('awards sprint_mvp badge to the winner', () => {
      const story = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 5,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const { badges } = calculateSprintScores(sprint, [story], users, [], BASE_SETTINGS)
      expect(badges.some(b => b.userId === 'dev-1' && b.badgeKey === 'sprint_mvp')).toBe(true)
    })

    it('awards clean_sprint badge when zero spills', () => {
      const story = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 3,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const { badges } = calculateSprintScores(sprint, [story], users, [], BASE_SETTINGS)
      expect(badges.some(b => b.userId === 'dev-1' && b.badgeKey === 'clean_sprint')).toBe(true)
    })

    it('does not award clean_sprint badge when user has spills', () => {
      const done = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 5,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const spilled = makeStory({ assigneeId: 'dev-1', status: 'spilled' })
      const { badges } = calculateSprintScores(sprint, [done, spilled], users, [], BASE_SETTINGS)
      expect(badges.some(b => b.userId === 'dev-1' && b.badgeKey === 'clean_sprint')).toBe(false)
    })

    it('awards critical_crusher badge for completing a critical story', () => {
      const story = makeStory({
        assigneeId: 'dev-1', status: 'done', priority: 'critical', storyPoints: 3,
        completedAt: '2026-03-14T10:00:00.000Z',
      })
      const { badges } = calculateSprintScores(sprint, [story], users, [], BASE_SETTINGS)
      expect(badges.some(b => b.userId === 'dev-1' && b.badgeKey === 'critical_crusher')).toBe(true)
    })

    it('awards first_blood to the user who completed the first story', () => {
      const early = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 3,
        completedAt: '2026-03-05T08:00:00.000Z' })
      const late = makeStory({ assigneeId: 'dev-2', status: 'done', storyPoints: 3,
        completedAt: '2026-03-10T08:00:00.000Z' })
      const { badges } = calculateSprintScores(sprint, [early, late], users, [], BASE_SETTINGS)
      expect(badges.some(b => b.userId === 'dev-1' && b.badgeKey === 'first_blood')).toBe(true)
      expect(badges.some(b => b.userId === 'dev-2' && b.badgeKey === 'first_blood')).toBe(false)
    })

    it('awards speed_demon when all stories completed 2+ days early', () => {
      const s1 = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 3,
        completedAt: '2026-03-10T00:00:00.000Z' }) // 4 days early
      const s2 = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 2,
        completedAt: '2026-03-11T00:00:00.000Z' }) // 3 days early
      const { badges } = calculateSprintScores(sprint, [s1, s2], users, [], BASE_SETTINGS)
      expect(badges.some(b => b.userId === 'dev-1' && b.badgeKey === 'speed_demon')).toBe(true)
    })

    it('does not award speed_demon when any story is not 2+ days early', () => {
      const early = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 3,
        completedAt: '2026-03-10T00:00:00.000Z' }) // early
      const onTime = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 2,
        completedAt: '2026-03-14T10:00:00.000Z' }) // last day
      const { badges } = calculateSprintScores(sprint, [early, onTime], users, [], BASE_SETTINGS)
      expect(badges.some(b => b.userId === 'dev-1' && b.badgeKey === 'speed_demon')).toBe(false)
    })
  })

  describe('historical badges', () => {
    it('awards hat_trick when user wins 3 consecutive sprints', () => {
      const historicalResults: SprintResult[] = [
        { id: 'r1', sprintId: 'sprint-prev1', userId: 'dev-1', rank: 1, pointsScored: 20,
          storiesCompleted: 3, storiesSpilled: 0, storiesTotal: 3, onTimeRate: 1,
          rawStoryPoints: 9, bonusPoints: 11, penaltyPoints: 0, isEligible: true, isWinner: true },
        { id: 'r2', sprintId: 'sprint-prev2', userId: 'dev-1', rank: 1, pointsScored: 18,
          storiesCompleted: 2, storiesSpilled: 0, storiesTotal: 2, onTimeRate: 1,
          rawStoryPoints: 8, bonusPoints: 10, penaltyPoints: 0, isEligible: true, isWinner: true },
      ]
      const story = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 8,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const { badges } = calculateSprintScores(sprint, [story], users, [], BASE_SETTINGS, historicalResults)
      expect(badges.some(b => b.userId === 'dev-1' && b.badgeKey === 'hat_trick')).toBe(true)
    })

    it('does not award hat_trick after only 1 historical win', () => {
      const historicalResults: SprintResult[] = [
        { id: 'r1', sprintId: 'sprint-prev1', userId: 'dev-1', rank: 1, pointsScored: 20,
          storiesCompleted: 3, storiesSpilled: 0, storiesTotal: 3, onTimeRate: 1,
          rawStoryPoints: 9, bonusPoints: 11, penaltyPoints: 0, isEligible: true, isWinner: true },
      ]
      const story = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 8,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const { badges } = calculateSprintScores(sprint, [story], users, [], BASE_SETTINGS, historicalResults)
      expect(badges.some(b => b.userId === 'dev-1' && b.badgeKey === 'hat_trick')).toBe(false)
    })

    it('awards iron_dev on 5th eligible sprint', () => {
      const historicalResults: SprintResult[] = Array.from({ length: 4 }, (_, i) => ({
        id: `r${i}`, sprintId: `sprint-old-${i}`, userId: 'dev-1',
        rank: 2, pointsScored: 10, storiesCompleted: 1, storiesSpilled: 0,
        storiesTotal: 1, onTimeRate: 1, rawStoryPoints: 5, bonusPoints: 5,
        penaltyPoints: 0, isEligible: true, isWinner: false,
      }))
      const story = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 3,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const { badges } = calculateSprintScores(sprint, [story], users, [], BASE_SETTINGS, historicalResults)
      expect(badges.some(b => b.userId === 'dev-1' && b.badgeKey === 'iron_dev')).toBe(true)
    })

    it('awards comeback_kid when rank improved vs previous sprint', () => {
      const historicalResults: SprintResult[] = [
        { id: 'r1', sprintId: 'sprint-prev', userId: 'dev-1', rank: 3, pointsScored: 5,
          storiesCompleted: 1, storiesSpilled: 0, storiesTotal: 1, onTimeRate: 1,
          rawStoryPoints: 5, bonusPoints: 0, penaltyPoints: 0, isEligible: true, isWinner: false },
      ]
      const s1 = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 8,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const s2 = makeStory({ assigneeId: 'dev-2', status: 'done', storyPoints: 3,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const { badges } = calculateSprintScores(sprint, [s1, s2], users, [], BASE_SETTINGS, historicalResults)
      // dev-1 moved from rank 3 to rank 1
      expect(badges.some(b => b.userId === 'dev-1' && b.badgeKey === 'comeback_kid')).toBe(true)
    })

    it('does not award comeback_kid when rank stayed the same', () => {
      const historicalResults: SprintResult[] = [
        { id: 'r1', sprintId: 'sprint-prev', userId: 'dev-1', rank: 1, pointsScored: 20,
          storiesCompleted: 3, storiesSpilled: 0, storiesTotal: 3, onTimeRate: 1,
          rawStoryPoints: 9, bonusPoints: 11, penaltyPoints: 0, isEligible: true, isWinner: true },
      ]
      const story = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 8,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const { badges } = calculateSprintScores(sprint, [story], users, [], BASE_SETTINGS, historicalResults)
      expect(badges.some(b => b.userId === 'dev-1' && b.badgeKey === 'comeback_kid')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('returns empty results and badges for empty user list', () => {
      const story = makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 5,
        completedAt: '2026-03-14T10:00:00.000Z' })
      const { results, badges } = calculateSprintScores(sprint, [story], [], [], BASE_SETTINGS)
      expect(results).toEqual([])
      expect(badges).toEqual([])
    })

    it('total points never goes below 0', () => {
      // Multiple spills, small base points
      const stories = Array.from({ length: 5 }, () =>
        makeStory({ assigneeId: 'dev-1', status: 'spilled', storyPoints: 1 })
      )
      stories.push(makeStory({ assigneeId: 'dev-1', status: 'done', storyPoints: 1,
        completedAt: '2026-03-14T10:00:00.000Z' }))
      const { results } = calculateSprintScores(sprint, stories, users, [], BASE_SETTINGS)
      expect(results.find(r => r.userId === 'dev-1')!.pointsScored).toBeGreaterThanOrEqual(0)
    })

    it('only counts stories from the current sprint', () => {
      const wrongSprint = makeStory({
        assigneeId: 'dev-1', status: 'done', storyPoints: 13,
        sprintId: 'sprint-other', completedAt: '2026-03-14T10:00:00.000Z',
      })
      const { results } = calculateSprintScores(sprint, [wrongSprint], users, [], BASE_SETTINGS)
      expect(results.find(r => r.userId === 'dev-1')!.isEligible).toBe(false)
    })
  })
})
