import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

export async function getSkills(userToken: string) {
  const { data } = await axios.get(`${BASE_URL}/skills`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  return data;
}

export async function installSkill(skillId: string, userToken: string) {
  const { data } = await axios.post(
    `${BASE_URL}/skills/install`,
    { skillId },
    { headers: { Authorization: `Bearer ${userToken}` } }
  );
  return data;
}

export async function generatePreview(skillId: string, inputData: any, userToken: string) {
  const { data } = await axios.post(
    `${BASE_URL}/skills/preview`,
    { skillId, inputData },
    { headers: { Authorization: `Bearer ${userToken}` } }
  );
  return data;
}

export async function getMetrics(userToken: string) {
  const { data } = await axios.get(`${BASE_URL}/metrics`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  return data;
}

export async function upgradeTier(tier: string, userToken: string) {
  const { data } = await axios.post(
    `${BASE_URL}/tiers/upgrade`,
    { tier },
    { headers: { Authorization: `Bearer ${userToken}` } }
  );
  return data;
}
