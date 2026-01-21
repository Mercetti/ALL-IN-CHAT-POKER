/**
 * Skill Registry - Skill Management
 * Manages available skills and their metadata
 */

export interface Skill {
  id: string
  name: string
  description: string
  tier: string
  category: string
  isActive: boolean
}

export class SkillRegistry {
  private skills: Map<string, Skill> = new Map()

  constructor() {
    this.initializeDefaultSkills()
  }

  private initializeDefaultSkills(): void {
    const defaultSkills: Skill[] = [
      {
        id: 'basic_chat',
        name: 'Basic Chat',
        description: 'Simple chat interaction',
        tier: 'free',
        category: 'communication',
        isActive: true
      },
      {
        id: 'poker_deal',
        name: 'Deal Cards',
        description: 'Deal poker hands',
        tier: 'creator',
        category: 'gaming',
        isActive: true
      },
      {
        id: 'poker_bet',
        name: 'Place Bet',
        description: 'Place poker bets',
        tier: 'creator',
        category: 'gaming',
        isActive: true
      },
      {
        id: 'analytics',
        name: 'Analytics',
        description: 'System analytics and monitoring',
        tier: 'creator+',
        category: 'monitoring',
        isActive: true
      },
      {
        id: 'monitoring',
        name: 'System Monitoring',
        description: 'Real-time system monitoring',
        tier: 'enterprise',
        category: 'monitoring',
        isActive: true
      }
    ]

    defaultSkills.forEach(skill => {
      this.skills.set(skill.id, skill)
    })
  }

  listPublic(): Skill[] {
    return Array.from(this.skills.values()).filter(skill => skill.isActive)
  }

  getSkill(id: string): Skill | undefined {
    return this.skills.get(id)
  }

  registerSkill(skill: Skill): void {
    this.skills.set(skill.id, skill)
  }

  unregisterSkill(id: string): boolean {
    return this.skills.delete(id)
  }

  updateSkill(id: string, updates: Partial<Skill>): boolean {
    const skill = this.skills.get(id)
    if (skill) {
      Object.assign(skill, updates)
      return true
    }
    return false
  }

  getSkillsByCategory(category: string): Skill[] {
    return this.listPublic().filter(skill => skill.category === category)
  }

  getSkillsByTier(tier: string): Skill[] {
    return this.listPublic().filter(skill => skill.tier === tier)
  }
}
