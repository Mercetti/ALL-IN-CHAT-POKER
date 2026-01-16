import { Phase } from '../types';

export const Phase1: Phase = {
  number: 1,
  name: 'Core Deployment',
  skills: ['WebOperations', 'ContentManagement', 'Analytics'],
  trainingEnvironment: 'staging.acey-multi-site.com',
  testSites: [
    'test-site-1.acey-multi-site.com',
    'test-site-2.acey-multi-site.com',
    'demo-site.acey-multi-site.com'
  ],
  escalationRules: [
    'notifyOwner',
    'logError',
    'pauseModule',
    'rollbackChanges',
    'emergencyStop'
  ]
};
