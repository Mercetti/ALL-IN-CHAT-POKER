import { Phase } from '../types';

export const Phase3: Phase = {
  number: 3,
  name: 'Advanced Skills',
  skills: ['Personalization', 'PredictiveAnalytics'],
  trainingEnvironment: 'production-advanced.acey-multi-site.com',
  testSites: [
    'personalization-test.acey-multi-site.com',
    'analytics-test.acey-multi-site.com',
    'ml-test.acey-multi-site.com'
  ],
  escalationRules: [
    'notifyOwner',
    'notifyDevelopers',
    'logError',
    'pauseModule',
    'mlValidation',
    'biasCheck',
    'performanceMonitoring'
  ]
};
