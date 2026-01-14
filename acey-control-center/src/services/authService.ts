export type UserRole = 'owner' | 'dev' | 'streamer' | 'user';

export interface UserAccess {
  tier: 'Free' | 'Pro' | 'Creator+' | 'Enterprise';
  trialRemaining: number;
  unlockedSkills: string[];
  role: UserRole;
  permissions: string[];
  trials?: Array<{
    skillName: string;
    expiresInHours: number;
  }>;
}

export async function getUserAccess(userToken: string): Promise<UserAccess> {
  try {
    // This would call your actual API
    // const { data } = await axios.get(`${BASE_URL}/user/access`, {
    //   headers: { Authorization: `Bearer ${userToken}` },
    // });
    // return data;
    
    // Mock implementation for now
    return {
      tier: 'Pro',
      trialRemaining: 3,
      unlockedSkills: ['code', 'link'],
      role: 'dev',
      permissions: ['basic', 'lab_access']
    };
  } catch (error) {
    console.error('Error fetching user access:', error);
    // Fallback to basic access
    return {
      tier: 'Free',
      trialRemaining: 7,
      unlockedSkills: ['code'],
      role: 'user',
      permissions: ['basic']
    };
  }
}

export function canAccessAceyLab(role: UserRole): boolean {
  return role === 'owner' || role === 'dev';
}

export function canApproveOutput(role: UserRole): boolean {
  return role === 'owner' || role === 'dev';
}

export function canViewAllMetrics(role: UserRole): boolean {
  return role === 'owner' || role === 'dev';
}

export function canUnlockSkills(role: UserRole): boolean {
  return role !== 'user'; // All roles except basic user can unlock skills
}

export function getSkillAccessByTier(tier: string): string[] {
  switch (tier) {
    case 'Free':
      return ['code']; // Basic code helper
    case 'Pro':
      return ['code', 'link']; // Code + link review
    case 'Creator+':
      return ['code', 'link', 'audio', 'graphics']; // All creative skills
    case 'Enterprise':
      return ['code', 'link', 'audio', 'graphics', 'streaming', 'games']; // All skills
    default:
      return ['code'];
  }
}

export function canAccessSkill(skillType: string, userAccess: UserAccess): boolean {
  return userAccess.unlockedSkills.includes(skillType) || 
         getSkillAccessByTier(userAccess.tier).includes(skillType);
}
