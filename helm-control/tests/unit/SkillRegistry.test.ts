/**
 * Skill Registry Unit Tests
 * Tests skill management, registration, and filtering
 */

import { SkillRegistry, Skill } from '../../packages/helm-control/src/skills/SkillRegistry';

describe('SkillRegistry', () => {
  let skillRegistry: SkillRegistry;

  beforeEach(() => {
    skillRegistry = new SkillRegistry();

  describe('Constructor', () => {
    test('should initialize with default skills', () => {
      expect(skillRegistry).toBeDefined();
      const skills = skillRegistry.listPublic();
      expect(skills.length).toBeGreaterThan(0);

    test('should have default skills loaded', () => {
      const skills = skillRegistry.listPublic();
      const skillIds = skills.map(skill => skill.id);
      
      expect(skillIds).toContain('basic_chat');
      expect(skillIds).toContain('poker_deal');
      expect(skillIds).toContain('poker_bet');
      expect(skillIds).toContain('analytics');
      expect(skillIds).toContain('monitoring');
  });

  describe('listPublic()', () => {
    test('should return only active skills', () => {
      const skills = skillRegistry.listPublic();
      const allActive = skills.every(skill => skill.isActive);
      expect(allActive).toBe(true);

    test('should return array of skills', () => {
      const skills = skillRegistry.listPublic();
      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);

    test('should return skill objects with required properties', () => {
      const skills = skillRegistry.listPublic();
      const skill = skills[0];
      
      expect(skill).toHaveProperty('id');
      expect(skill).toHaveProperty('name');
      expect(skill).toHaveProperty('description');
      expect(skill).toHaveProperty('tier');
      expect(skill).toHaveProperty('category');
      expect(skill).toHaveProperty('isActive');
  });

  describe('getSkill()', () => {
    test('should return existing skill', () => {
      const skill = skillRegistry.getSkill('basic_chat');
      expect(skill).toBeDefined();
      expect(skill?.id).toBe('basic_chat');

    test('should return undefined for non-existent skill', () => {
      const skill = skillRegistry.getSkill('nonexistent_skill');
      expect(skill).toBeUndefined();

    test('should return skill with correct properties', () => {
      const skill = skillRegistry.getSkill('basic_chat');
      expect(skill).toMatchObject({
        id: 'basic_chat',
        name: 'Basic Chat',
        description: 'Simple chat interaction',
        tier: 'free',
        category: 'communication',
        isActive: true
      });
  });

  describe('registerSkill()', () => {
    test('should register new skill', () => {
      const newSkill: Skill = {
        id: 'test_skill',
        name: 'Test Skill',
        description: 'A test skill',
        tier: 'free',
        category: 'test',
        isActive: true
      };

      skillRegistry.registerSkill(newSkill);
      const retrievedSkill = skillRegistry.getSkill('test_skill');
      expect(retrievedSkill).toEqual(newSkill);

    test('should overwrite existing skill', () => {
      const originalSkill = skillRegistry.getSkill('basic_chat');
      expect(originalSkill?.name).toBe('Basic Chat');

      const updatedSkill: Skill = {
        id: 'basic_chat',
        name: 'Updated Basic Chat',
        description: 'Updated description',
        tier: 'pro',
        category: 'communication',
        isActive: true
      };

      skillRegistry.registerSkill(updatedSkill);
      const retrievedSkill = skillRegistry.getSkill('basic_chat');
      expect(retrievedSkill?.name).toBe('Updated Basic Chat');

    test('should handle inactive skills', () => {
      const inactiveSkill: Skill = {
        id: 'inactive_skill',
        name: 'Inactive Skill',
        description: 'An inactive skill',
        tier: 'free',
        category: 'test',
        isActive: false
      };

      skillRegistry.registerSkill(inactiveSkill);
      const publicSkills = skillRegistry.listPublic();
      const inactiveInPublic = publicSkills.some(skill => skill.id === 'inactive_skill');
      expect(inactiveInPublic).toBe(false);
  });

  describe('unregisterSkill()', () => {
    test('should remove existing skill', () => {
      const skillExists = skillRegistry.getSkill('basic_chat');
      expect(skillExists).toBeDefined();

      const removed = skillRegistry.unregisterSkill('basic_chat');
      expect(removed).toBe(true);

      const skillRemoved = skillRegistry.getSkill('basic_chat');
      expect(skillRemoved).toBeUndefined();

    test('should return false for non-existent skill', () => {
      const removed = skillRegistry.unregisterSkill('nonexistent_skill');
      expect(removed).toBe(false);

    test('should not affect other skills', () => {
      const beforeCount = skillRegistry.listPublic().length;
      skillRegistry.unregisterSkill('basic_chat');
      const afterCount = skillRegistry.listPublic().length;
      expect(afterCount).toBe(beforeCount - 1);
  });

  describe('updateSkill()', () => {
    test('should update existing skill', () => {
      const updated = skillRegistry.updateSkill('basic_chat', {
        name: 'Updated Basic Chat',
        tier: 'pro'
      });

      expect(updated).toBe(true);

      const skill = skillRegistry.getSkill('basic_chat');
      expect(skill?.name).toBe('Updated Basic Chat');
      expect(skill?.tier).toBe('pro');

    test('should return false for non-existent skill', () => {
      const updated = skillRegistry.updateSkill('nonexistent_skill', {
        name: 'Updated Name'
      });

      expect(updated).toBe(false);

    test('should preserve unchanged properties', () => {
      const originalSkill = skillRegistry.getSkill('poker_deal');
      const originalDescription = originalSkill?.description;

      skillRegistry.updateSkill('poker_deal', {
        name: 'Updated Deal Skill'
      });

      const updatedSkill = skillRegistry.getSkill('poker_deal');
      expect(updatedSkill?.name).toBe('Updated Deal Skill');
      expect(updatedSkill?.description).toBe(originalDescription);
  });

  describe('getSkillsByCategory()', () => {
    test('should return skills in specific category', () => {
      const communicationSkills = skillRegistry.getSkillsByCategory('communication');
      expect(communicationSkills.length).toBeGreaterThan(0);
      expect(communicationSkills.every(skill => skill.category === 'communication')).toBe(true);

    test('should return empty array for non-existent category', () => {
      const skills = skillRegistry.getSkillsByCategory('nonexistent_category');
      expect(skills).toEqual([]);

    test('should return only active skills', () => {
      const skills = skillRegistry.getSkillsByCategory('communication');
      expect(skills.every(skill => skill.isActive)).toBe(true);
  });

  describe('getSkillsByTier()', () => {
    test('should return skills in specific tier', () => {
      const freeSkills = skillRegistry.getSkillsByTier('free');
      expect(freeSkills.length).toBeGreaterThan(0);
      expect(freeSkills.every(skill => skill.tier === 'free')).toBe(true);

    test('should return empty array for non-existent tier', () => {
      const skills = skillRegistry.getSkillsByTier('nonexistent_tier');
      expect(skills).toEqual([]);

    test('should return only active skills', () => {
      const skills = skillRegistry.getSkillsByTier('free');
      expect(skills.every(skill => skill.isActive)).toBe(true);
  });

  describe('Edge Cases', () => {
    test('should handle empty skill id', () => {
      const skill = skillRegistry.getSkill('');
      expect(skill).toBeUndefined();

    test('should handle null skill id', () => {
      const skill = skillRegistry.getSkill(null as any);
      expect(skill).toBeUndefined();

    test('should handle undefined skill id', () => {
      const skill = skillRegistry.getSkill(undefined as any);
      expect(skill).toBeUndefined();

    test('should handle skill with missing properties', () => {
      const incompleteSkill = {
        id: 'incomplete_skill',
        name: 'Incomplete Skill'
        // Missing required properties
      } as any;

      expect(() => {
        skillRegistry.registerSkill(incompleteSkill);
      }).not.toThrow(); // Should not throw, but may not work correctly
    });

    test('should handle skill with empty properties', () => {
      const emptySkill: Skill = {
        id: 'empty_skill',
        name: '',
        description: '',
        tier: 'free',
        category: '',
        isActive: true
      };

      skillRegistry.registerSkill(emptySkill);
      const retrievedSkill = skillRegistry.getSkill('empty_skill');
      expect(retrievedSkill?.name).toBe('');
  });

  describe('Integration Tests', () => {
    test('should handle multiple operations', () => {
      // Register multiple skills
      const skills: Skill[] = [
        {
          id: 'skill1',
          name: 'Skill 1',
          description: 'First test skill',
          tier: 'free',
          category: 'test',
          isActive: true
        },
        {
          id: 'skill2',
          name: 'Skill 2',
          description: 'Second test skill',
          tier: 'pro',
          category: 'test',
          isActive: true
        },
        {
          id: 'skill3',
          name: 'Skill 3',
          description: 'Third test skill',
          tier: 'enterprise',
          category: 'test',
          isActive: false
        }
      ];

      skills.forEach(skill => skillRegistry.registerSkill(skill));

      // Test filtering
      const testSkills = skillRegistry.getSkillsByCategory('test');
      expect(testSkills.length).toBe(2); // Only active skills

      const proSkills = skillRegistry.getSkillsByTier('pro');
      expect(proSkills.length).toBe(1);
      expect(proSkills[0].id).toBe('skill2');

      // Test updates
      skillRegistry.updateSkill('skill1', { tier: 'pro' });
      const updatedProSkills = skillRegistry.getSkillsByTier('pro');
      expect(updatedProSkills.length).toBe(2);

      // Test removal
      skillRegistry.unregisterSkill('skill2');
      const finalProSkills = skillRegistry.getSkillsByTier('pro');
      expect(finalProSkills.length).toBe(1);
      expect(finalProSkills[0].id).toBe('skill1');

    test('should maintain skill order consistency', () => {
      const skills1 = skillRegistry.listPublic();
      const skills2 = skillRegistry.listPublic();
      
      expect(skills1.length).toBe(skills2.length);
      skills1.forEach((skill, index) => {
        expect(skill.id).toBe(skills2[index].id);
    });

    test('should handle concurrent operations', () => {
      // Register multiple skills rapidly
      for (let i = 0; i < 10; i++) {
        const skill: Skill = {
          id: `concurrent_skill_${i}`,
          name: `Concurrent Skill ${i}`,
          description: `Test skill ${i}`,
          tier: 'free',
          category: 'test',
          isActive: true
        };
        skillRegistry.registerSkill(skill);
      }

      // Verify all skills are registered
      const testSkills = skillRegistry.getSkillsByCategory('test');
      expect(testSkills.length).toBeGreaterThanOrEqual(10);

      // Remove all concurrent skills
      for (let i = 0; i < 10; i++) {
        skillRegistry.unregisterSkill(`concurrent_skill_${i}`);
      }

      // Verify removal
      const finalTestSkills = skillRegistry.getSkillsByCategory('test');
      const concurrentSkillsRemaining = finalTestSkills.filter(skill => 
        skill.id.startsWith('concurrent_skill_')
      );
      expect(concurrentSkillsRemaining.length).toBe(0);
  });
