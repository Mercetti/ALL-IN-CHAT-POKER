import { Phase } from '../types';

export const Phase2: Phase = {
  number: 2,
  name: 'Supportive Skills',
  skills: ['Security', 'Integrations'],
  trainingEnvironment: 'staging-secure.acey-multi-site.com',
  testSites: [
    'security-test.acey-multi-site.com',
    'integration-test.acey-multi-site.com',
    'api-test.acey-multi-site.com'
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
