import { Phase } from '../types';

export const Phase2: Phase = {
  number: 2,
  name: 'Supportive Skills',
  skills: ['Security', 'Integrations'],
  trainingEnvironment: 'staging-secure.helm-multi-site.com',
  testSites: [
    'security-test.helm-multi-site.com',
    'integration-test.helm-multi-site.com',
    'api-test.helm-multi-site.com'
  ],
  escalationRules: [
    'notifyOwner',
    'notifyDevelopers',
    'logError',
    'pauseModule',
    'securityProtocol',
    'dataBackup'
  ]
};
