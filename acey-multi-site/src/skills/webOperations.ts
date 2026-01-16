import { SkillModule } from '../types';

export const WebOperations: SkillModule = {
  name: 'WebOperations',
  description: 'Monitor uptime, server health, automate routine tasks',
  phase: 1,
  status: 'training',
  allowedOperations: [
    'readServerMetrics',
    'runScheduledTasks',
    'deployContent',
    'checkUptime',
    'restartServices',
    'backupDatabase',
    'updateSSL',
    'clearCache'
  ],
  safetyConstraints: [
    'noDestructiveActions',
    'approvalRequiredForDeploy',
    'backupBeforeChanges',
    'rateLimitOperations',
    'logAllActions'
  ]
};

export const ContentManagement: SkillModule = {
  name: 'ContentManagement',
  description: 'Post/edit content, moderate comments, handle inquiries',
  phase: 1,
  status: 'training',
  allowedOperations: [
    'createPost',
    'editPost',
    'deletePost',
    'moderateComment',
    'approveContent',
    'scheduleContent',
    'manageMedia',
    'handleInquiries'
  ],
  safetyConstraints: [
    'noPublishWithoutApproval',
    'contentFiltering',
    'backupBeforeDelete',
    'auditAllChanges',
    'respectContentGuidelines'
  ]
};

export const Analytics: SkillModule = {
  name: 'Analytics',
  description: 'Track user behavior, generate reports, provide insights',
  phase: 2,
  status: 'inactive',
  dependencies: ['WebOperations'],
  allowedOperations: [
    'trackPageViews',
    'analyzeUserBehavior',
    'generateReports',
    'trackConversions',
    'monitorPerformance',
    'predictTrends',
    'exportData',
    'createDashboards'
  ],
  safetyConstraints: [
    'anonymizeData',
    'respectPrivacy',
    'noDataSharing',
    'secureStorage',
    'complianceChecks'
  ]
};

export const Security: SkillModule = {
  name: 'Security',
  description: 'Monitor threats, enforce policies, manage access',
  phase: 2,
  status: 'inactive',
  dependencies: ['WebOperations'],
  allowedOperations: [
    'scanVulnerabilities',
    'enforcePolicies',
    'manageAccess',
    'monitorThreats',
    'auditSecurity',
    'encryptData',
    'manageFirewall',
    'incidentResponse'
  ],
  safetyConstraints: [
    'noUnauthorizedAccess',
    'minimalDataCollection',
    'secureLogging',
    'complianceFirst',
    'emergencyProtocols'
  ]
};

export const Integrations: SkillModule = {
  name: 'Integrations',
  description: 'Connect third-party services, manage APIs, sync data',
  phase: 3,
  status: 'inactive',
  dependencies: ['ContentManagement', 'Analytics'],
  allowedOperations: [
    'connectAPIs',
    'syncData',
    'manageWebhooks',
    'handleOAuth',
    'processPayments',
    'integrateCRM',
    'manageEmail',
    'socialMediaIntegration'
  ],
  safetyConstraints: [
    'validateAPIs',
    'secureConnections',
    'dataMinimization',
    'rateLimitAPI',
    'fallbackProtocols'
  ]
};

export const Personalization: SkillModule = {
  name: 'Personalization',
  description: 'Adapt content, recommend items, optimize user experience',
  phase: 3,
  status: 'inactive',
  dependencies: ['Analytics'],
  allowedOperations: [
    'adaptContent',
    'recommendItems',
    'optimizeUX',
    'personalizeLayout',
    'trackPreferences',
    'abTesting',
    'segmentUsers',
    'optimizePerformance'
  ],
  safetyConstraints: [
    'respectPrivacy',
    'optInRequired',
    'transparentAlgorithms',
    'biasDetection',
    'userControl'
  ]
};

export const PredictiveAnalytics: SkillModule = {
  name: 'PredictiveAnalytics',
  description: 'Forecast trends, predict outcomes, optimize strategies',
  phase: 4,
  status: 'inactive',
  dependencies: ['Analytics', 'Personalization'],
  allowedOperations: [
    'forecastTrends',
    'predictOutcomes',
    'optimizeStrategies',
    'marketAnalysis',
    'riskAssessment',
    'opportunityIdentification',
    'scenarioPlanning',
    'predictiveMaintenance'
  ],
  safetyConstraints: [
    'ethicalAI',
    'transparentPredictions',
    'humanOversight',
    'biasMitigation',
    'accuracyValidation'
  ]
};

export const Automation: SkillModule = {
  name: 'Automation',
  description: 'Automate workflows, optimize processes, reduce manual work',
  phase: 4,
  status: 'inactive',
  dependencies: ['Integrations', 'Security'],
  allowedOperations: [
    'automateWorkflows',
    'optimizeProcesses',
    'scheduleTasks',
    'triggerActions',
    'manageQueues',
    'optimizeResources',
    'autoScaling',
    'processOptimization'
  ],
  safetyConstraints: [
    'humanApprovalRequired',
    'rollbackCapability',
    'monitoringRequired',
    'auditTrails',
    'emergencyStops'
  ]
};

export const ContinuousLearning: SkillModule = {
  name: 'ContinuousLearning',
  description: 'Learn from data, improve models, adapt to changes',
  phase: 5,
  status: 'inactive',
  dependencies: ['PredictiveAnalytics', 'Automation'],
  allowedOperations: [
    'learnFromData',
    'improveModels',
    'adaptToChanges',
    'feedbackProcessing',
    'modelRetraining',
    'performanceOptimization',
    'knowledgeUpdate',
    'selfImprovement'
  ],
  safetyConstraints: [
    'controlledLearning',
    'humanValidation',
    'ethicalGuidelines',
    'transparencyRequired',
    'safetyFirst'
  ]
};
