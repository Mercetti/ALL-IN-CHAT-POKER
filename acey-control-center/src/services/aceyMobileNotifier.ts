import { Notifications } from 'expo-notifications';

export async function notifySkillUnlock(skillId: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Skill Unlocked! 🎉',
      body: `You've successfully unlocked the ${skillId} skill!`,
      data: { type: 'skill_unlock', skillId },
    },
    trigger: null,
  });
}

export async function notifyTrialExpiration(skillName: string, hoursLeft: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Trial Expiring ⏰',
      body: `Your trial for ${skillName} expires in ${hoursLeft} hours`,
      data: { type: 'trial_warning', skillName, hoursLeft },
    },
    trigger: null,
  });
}

export async function notifyApprovedOutput(userToken: string, skillType: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Output Approved ✅',
      body: `New ${skillType} output has been approved for learning`,
      data: { type: 'new_approved_output', skillType, userToken },
    },
    trigger: null,
  });
}

export async function notifyAccessDenied(skillId: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Access Denied 🔒',
      body: `You don't have permission to access ${skillId}`,
      data: { type: 'locked_access_attempt', skillId },
    },
    trigger: null,
  });
}
