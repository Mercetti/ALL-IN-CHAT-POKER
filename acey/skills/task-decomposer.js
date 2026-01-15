/**
 * Task Decomposer Skill
 * Suggests next best task based on impact, effort, and risk analysis
 */

const FounderMemory = require('../memory/founder-memory');

class TaskDecomposer {
  constructor() {
    this.memory = new FounderMemory();
  }

  analyzeCurrentState() {
    const recentMemories = this.memory.getRecentMemories(10);
    
    // Analyze patterns and current context
    return {
      recentWork: recentMemories.filter(m => m.type === 'decision'),
      blockers: recentMemories.filter(m => m.type === 'warning'),
      completed: recentMemories.filter(m => m.tags.includes('completed'))
    };
  }

  suggestNextTask() {
    const state = this.analyzeCurrentState();
    
    // Current context: Just finished testing, EAS config fixed
    const tasks = [
      {
        id: "TASK-001",
        title: "Complete Play Store APK build",
        impact: "high",
        effort: "medium",
        risk: "low",
        urgency: "now",
        dependencies: ["EAS configuration"],
        reasoning: "EAS build config is now fixed, ready for production build"
      },
      {
        id: "TASK-002", 
        title: "Test APK on device before upload",
        impact: "high",
        effort: "low",
        risk: "medium",
        urgency: "after-build",
        dependencies: ["APK build completion"],
        reasoning: "Critical to verify functionality before Play Store submission"
      },
      {
        id: "TASK-003",
        title: "Implement Stream Ops Watchdog",
        impact: "medium",
        effort: "medium", 
        risk: "low",
        urgency: "this-week",
        dependencies: ["Core system stable"],
        reasoning: "Will reduce production monitoring cognitive load"
      }
    ];

    // Return highest priority task
    return tasks.sort((a, b) => {
      const scoreA = this.calculateTaskScore(a);
      const scoreB = this.calculateTaskScore(b);
      return scoreB - scoreA;
    })[0];
  }

  calculateTaskScore(task) {
    const impactWeight = 0.4;
    const effortWeight = -0.3; // Negative - less effort is better
    const riskWeight = -0.2; // Negative - less risk is better
    const urgencyWeight = 0.3;

    const impactScore = task.impact === 'high' ? 3 : task.impact === 'medium' ? 2 : 1;
    const effortScore = task.effort === 'low' ? 3 : task.effort === 'medium' ? 2 : 1;
    const riskScore = task.risk === 'low' ? 3 : task.risk === 'medium' ? 2 : 1;
    const urgencyScore = task.urgency === 'now' ? 3 : task.urgency === 'this-week' ? 2 : 1;

    return (
      impactScore * impactWeight +
      effortScore * effortWeight +
      riskScore * riskWeight +
      urgencyScore * urgencyWeight
    );
  }

  detectOverload() {
    const recentMemories = this.memory.getRecentMemories(20);
    const highEffortTasks = recentMemories.filter(m => 
      m.tags.includes('high-effort') || m.tags.includes('complex')
    );

    if (highEffortTasks.length > 5) {
      return {
        overloaded: true,
        message: "High cognitive load detected - consider delegating or postponing complex tasks",
        suggestion: "Focus on completing existing high-effort tasks before starting new ones"
      };
    }

    return { overloaded: false };
  }
}

module.exports = TaskDecomposer;
