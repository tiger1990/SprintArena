import type {
  Story, Sprint, User, SprintResult, SprintExclusion, WorkspaceSettings, UserBadge
} from '@/types'
import { generateId, daysBetween } from '@/lib/utils'

interface ScoringConfig {
  adminExcludedFromScoring: boolean
  earlyCompletionMultiplier: number
  criticalStoryBonus: number
  cleanSprintBonus: number
  spillPenalty: number
  minStoriesForEligibility: number
}

const DEFAULT_CONFIG: ScoringConfig = {
  adminExcludedFromScoring: true,
  earlyCompletionMultiplier: 1.25,
  criticalStoryBonus: 5,
  cleanSprintBonus: 10,
  spillPenalty: -2,
  minStoriesForEligibility: 1,
}

function hasBlockerComment(story: Story): boolean {
  return story.comments.some(c => c.isBlocker)
}

/**
 * Returns the ordered list of sprints a user won, ordered by sprint.createdAt
 * so consecutive-win detection works correctly regardless of endedAt timing.
 */
function getWinHistory(userId: string, historicalResults: SprintResult[]): string[] {
  return historicalResults
    .filter(r => r.userId === userId && r.isWinner)
    .map(r => r.sprintId)
}

/**
 * Returns how many sprints a user was eligible in (historically).
 */
function getEligibleSprintCount(userId: string, historicalResults: SprintResult[]): number {
  const sprintIds = new Set(
    historicalResults.filter(r => r.userId === userId && r.isEligible).map(r => r.sprintId)
  )
  return sprintIds.size
}

/**
 * Returns the last sprint result for a user before the current sprint,
 * based on the ordering of sprint results by earnedAt.
 */
function getPreviousResult(
  userId: string,
  currentSprintId: string,
  historicalResults: SprintResult[]
): SprintResult | null {
  const userHistory = historicalResults
    .filter(r => r.userId === userId && r.sprintId !== currentSprintId && r.isEligible)
  return userHistory.length > 0 ? userHistory[userHistory.length - 1] : null
}

export function calculateSprintScores(
  sprint: Sprint,
  stories: Story[],
  users: User[],
  exclusions: SprintExclusion[],
  settings: WorkspaceSettings,
  /** All previously persisted SprintResults — used for streak/comeback badges */
  historicalResults: SprintResult[] = []
): { results: SprintResult[]; badges: UserBadge[] } {
  const config: ScoringConfig = {
    ...DEFAULT_CONFIG,
    adminExcludedFromScoring: settings.adminExcludedFromScoring,
  }

  // Eligible users
  const excludedIds = new Set(exclusions.map(e => e.userId))
  const eligible = users.filter(u => {
    if (excludedIds.has(u.id)) return false
    if (config.adminExcludedFromScoring && u.role === 'admin') return false
    return true
  })

  // Sprint stories only
  const sprintStories = stories.filter(s => s.sprintId === sprint.id)

  const rawResults = eligible.map(user => {
    const userStories = sprintStories.filter(s => s.assigneeId === user.id)

    if (userStories.length < config.minStoriesForEligibility) {
      return {
        id: generateId(),
        sprintId: sprint.id,
        userId: user.id,
        rank: 0,
        pointsScored: 0,
        storiesCompleted: 0,
        storiesSpilled: 0,
        storiesTotal: userStories.length,
        onTimeRate: 0,
        rawStoryPoints: 0,
        bonusPoints: 0,
        penaltyPoints: 0,
        isEligible: false,
        isWinner: false,
      }
    }

    const completed = userStories.filter(s => s.status === 'done')
    const spilled = userStories.filter(s => s.status === 'spilled')

    let basePoints = 0
    let bonusPoints = 0
    let penaltyPoints = 0

    completed.forEach(story => {
      const pts = story.storyPoints
      const completedAt = story.completedAt || sprint.endDate
      const daysEarly = daysBetween(completedAt, sprint.endDate)
      const isCompletedBeforeEnd = new Date(completedAt) <= new Date(sprint.endDate)
      const isEarly = isCompletedBeforeEnd && daysEarly >= 2
      const multiplier = isEarly ? config.earlyCompletionMultiplier : 1.0
      basePoints += pts * multiplier

      if (story.priority === 'critical') {
        bonusPoints += config.criticalStoryBonus
      }
    })

    // Clean sprint bonus
    if (spilled.length === 0 && completed.length > 0) {
      bonusPoints += config.cleanSprintBonus
    }

    // Spill penalties (waived if story had a blocker comment)
    spilled.forEach(story => {
      if (!hasBlockerComment(story)) {
        penaltyPoints += Math.abs(config.spillPenalty)
      }
    })

    const totalPoints = Math.max(0, basePoints + bonusPoints - penaltyPoints)

    return {
      id: generateId(),
      sprintId: sprint.id,
      userId: user.id,
      rank: 0,
      pointsScored: Math.round(totalPoints * 100) / 100,
      storiesCompleted: completed.length,
      storiesSpilled: spilled.length,
      storiesTotal: userStories.length,
      onTimeRate: userStories.length > 0 ? completed.length / userStories.length : 0,
      rawStoryPoints: userStories.reduce((s, st) => s + (st.status === 'done' ? st.storyPoints : 0), 0),
      bonusPoints,
      penaltyPoints,
      isEligible: true,
      isWinner: false,
    }
  })

  // Sort and rank (eligible only)
  const eligibleResults = rawResults.filter(r => r.isEligible)
  const ineligibleResults = rawResults.filter(r => !r.isEligible)

  eligibleResults.sort((a, b) => {
    if (b.pointsScored !== a.pointsScored) return b.pointsScored - a.pointsScored
    if (b.storiesCompleted !== a.storiesCompleted) return b.storiesCompleted - a.storiesCompleted
    return b.onTimeRate - a.onTimeRate
  })

  eligibleResults.forEach((r, i) => { r.rank = i + 1 })

  // Handle ties for winner
  const topScore = eligibleResults[0]?.pointsScored ?? 0
  const winners = eligibleResults.filter(r => r.pointsScored === topScore && topScore > 0)
  winners.forEach(r => { r.isWinner = true })

  const results = [...eligibleResults, ...ineligibleResults]

  // ─── Badge awards ──────────────────────────────────────────────────────────
  const badges: UserBadge[] = []
  const now = new Date().toISOString()

  // sprint_mvp — awarded to all tied winners
  winners.forEach(result => {
    badges.push({
      id: generateId(), userId: result.userId,
      badgeKey: 'sprint_mvp', sprintId: sprint.id, earnedAt: now,
    })
  })

  eligibleResults.forEach(result => {
    const completedStories = sprintStories
      .filter(s => s.assigneeId === result.userId && s.status === 'done' && s.completedAt)
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime())

    // clean_sprint — zero spills, at least one story done
    if (result.storiesSpilled === 0 && result.storiesCompleted > 0) {
      badges.push({
        id: generateId(), userId: result.userId,
        badgeKey: 'clean_sprint', sprintId: sprint.id, earnedAt: now,
      })
    }

    // critical_crusher — completed at least one critical story
    const hasCritical = sprintStories.some(
      s => s.assigneeId === result.userId && s.priority === 'critical' && s.status === 'done'
    )
    if (hasCritical) {
      badges.push({
        id: generateId(), userId: result.userId,
        badgeKey: 'critical_crusher', sprintId: sprint.id, earnedAt: now,
      })
    }

    // first_blood — first member to complete any story in this sprint
    const allCompleted = sprintStories
      .filter(s => s.status === 'done' && s.completedAt)
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime())
    if (allCompleted[0]?.assigneeId === result.userId) {
      badges.push({
        id: generateId(), userId: result.userId,
        badgeKey: 'first_blood', sprintId: sprint.id, earnedAt: now,
      })
    }

    // speed_demon — every assigned story completed 2+ days before sprint end
    const allEarly = completedStories.every(s => {
      const daysEarly = daysBetween(s.completedAt!, sprint.endDate)
      return new Date(s.completedAt!) <= new Date(sprint.endDate) && daysEarly >= 2
    })
    if (allEarly && completedStories.length > 0) {
      badges.push({
        id: generateId(), userId: result.userId,
        badgeKey: 'speed_demon', sprintId: sprint.id, earnedAt: now,
      })
    }

    // ── New badges using historical data ────────────────────────────────────

    // hat_trick — won 3 consecutive sprints (last 2 historical + this sprint)
    if (result.isWinner) {
      const winHistory = getWinHistory(result.userId, historicalResults)
      // winHistory is ordered oldest→newest; check last 2 entries
      const lastTwoWins = winHistory.slice(-2)
      // We need the last 2 historical sprints for this user (not just wins)
      const recentSprints = [...new Set(
        historicalResults
          .filter(r => r.userId === result.userId && r.isEligible)
          .map(r => r.sprintId)
      )].slice(-2)

      const wonLastTwo = recentSprints.length === 2 &&
        recentSprints.every(sid => lastTwoWins.includes(sid))

      if (wonLastTwo) {
        badges.push({
          id: generateId(), userId: result.userId,
          badgeKey: 'hat_trick', sprintId: sprint.id, earnedAt: now,
        })
      }
    }

    // iron_dev — eligible in 5 or more sprints (counting this one)
    const previousEligibleCount = getEligibleSprintCount(result.userId, historicalResults)
    if (previousEligibleCount + 1 >= 5) {
      badges.push({
        id: generateId(), userId: result.userId,
        badgeKey: 'iron_dev', sprintId: sprint.id, earnedAt: now,
      })
    }

    // comeback_kid — improved rank vs. previous sprint
    const previousResult = getPreviousResult(result.userId, sprint.id, historicalResults)
    if (previousResult && previousResult.rank > result.rank && result.rank > 0) {
      badges.push({
        id: generateId(), userId: result.userId,
        badgeKey: 'comeback_kid', sprintId: sprint.id, earnedAt: now,
      })
    }
  })

  return { results, badges }
}
