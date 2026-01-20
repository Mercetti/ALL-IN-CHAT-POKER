import { Phase } from '../types';

export const Phase1: Phase = {
  number: 1,
  name: 'Core Deployment',
  skills: ['WebOperations', 'ContentManagement', 'Analytics'],
  trainingEnvironment: 'staging.helm-multi-site.com',
  testSites: [
    'test-site-1.helm-multi-site.com',
    'test-site-2.helm-multi-site.com',
    'demo-site.helm-multi-site.com'
  ],
  escalationRules: [
    'notifyOwner',
    'logError',
    'pauseModule',
    'rollbackChanges',
    'emergencyStop'
  ]
};
