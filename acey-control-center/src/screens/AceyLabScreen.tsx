import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import SkillCard from '../components/SkillCard';
import TrialTierBanner from '../components/TrialTierBanner';
import OwnerNotificationPanel from '../components/OwnerNotificationPanel';
import { getUserAccess, unlockSkill } from '../services/monetizationService';
import { AceyMobileOrchestrator } from '../services/aceyMobileOrchestrator';
import { notifySkillUnlock, notifyTrialExpiration, notifyApprovedOutput } from '../services/aceyMobileNotifier';

export default function AceyLabScreen({ userToken, ownerToken, username, userRole }: any) {
  const [userAccess, setUserAccess] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const orchestrator = new AceyMobileOrchestrator(ownerToken);

  const fetchData = async () => {
    const access = await getUserAccess(userToken);
    setUserAccess(access);
    if (orchestrator.userCanAccess(userRole)) {
      setNotifications(await orchestrator.getRecentEvents());
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUnlock = async (skillId: string) => {
    await unlockSkill(userToken, skillId);
    orchestrator.handleSkillUnlock(username, userToken, skillId);
    notifySkillUnlock(skillId);  // Local push notification
    fetchData();
  };

  // Mock skills data
  const skillsList = [
    {
      id: 'code_helper',
      name: 'Code Helper',
      icon: 'https://example.com/icon-code.png',
      type: 'code',
      tier: 'Free',
      description: 'AI-powered code completion and bug detection',
      features: ['Code completion', 'Bug detection', 'Syntax highlighting'],
      preview: 'function hello() { console.log("Hello World"); }'
    },
    {
      id: 'audio_maestro',
      name: 'Audio Maestro',
      icon: 'https://example.com/icon-audio.png',
      type: 'audio',
      tier: 'Pro',
      description: 'Generate custom audio tracks and music',
      features: ['Custom music generation', 'Voice synthesis', 'Audio effects'],
      preview: 'https://example.com/preview-audio.mp3'
    },
    {
      id: 'graphics_wizard',
      name: 'Graphics Wizard',
      icon: 'https://example.com/icon-graphics.png',
      type: 'graphics',
      tier: 'Creator+',
      description: 'AI-powered image generation and editing',
      features: ['Image generation', 'Style transfer', 'Brand assets'],
      preview: 'https://example.com/preview-image.jpg'
    }
  ];

  return (
    <ScrollView style={{ flex: 1, padding: 15 }}>
      <TrialTierBanner userAccess={userAccess} onUpgrade={() => console.log('Upgrade pressed')} />

      {skillsList.map(skill => (
        <SkillCard key={skill.id} skill={skill} userAccess={userAccess} onUnlock={handleUnlock} />
      ))}

      {orchestrator.userCanAccess(userRole) && <OwnerNotificationPanel notifications={notifications} />}
    </ScrollView>
  );
}
