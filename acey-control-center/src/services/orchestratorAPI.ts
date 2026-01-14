export async function fetchOrchestratorData(userToken: string) {
  // Pull all skill states, tier, trials, etc.
  return fetch(`https://your-backend.com/api/orchestrator/userData?token=${userToken}`)
    .then(res => res.json());
}

export async function triggerSkillInstall(userToken: string, skillId: string) {
  return fetch(`https://your-backend.com/api/orchestrator/installSkill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: userToken, skillId }),
  }).then(res => res.json());
}

export async function verifySubscription(userToken: string) {
  return fetch(`https://your-backend.com/api/orchestrator/verifySubscription?token=${userToken}`)
    .then(res => res.json());
}

export async function logApprovedOutput(userToken: string, skillType: string, outputData: any) {
  return fetch(`https://your-backend.com/api/orchestrator/logOutput`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: userToken, skillType, outputData }),
  }).then(res => res.json());
}
