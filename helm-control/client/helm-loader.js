/**
 * Helm Control Client Loader
 * Initializes Helm, authenticates, and loads allowed skills dynamically
 */

/* global fetch, console, window, navigator, document */

(function() {
    const HELM_API_KEY = "YOUR_CLIENT_API_KEY"; // assigned per client
    const HELM_API_URL = "https://api.helmcontrol.ai/v1";

    // Initialize Helm
    async function initHelm() {
      try {
        const response = await fetch(`${HELM_API_URL}/init`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": HELM_API_KEY
          }
        });
        const data = await response.json();

        if(data.success) {
          console.log("Helm initialized:", data);
          window.Helm = data.helmInstance; // global reference
          
          // Load allowed skills dynamically
          if(data.helmInstance.skills && data.helmInstance.skills.length > 0) {
            console.log("Loading skills:", data.helmInstance.skills);
            data.helmInstance.skills.forEach(skill => {
              loadHelmSkill(skill);
            });
          }
          
          // Initialize skill registry
          if(window.Helm && window.Helm.initSkillRegistry) {
            window.Helm.initSkillRegistry(data.helmInstance.allowedSkills);
          }
          
        } else {
          console.error("Helm initialization failed:", data.message);
        }
      } catch (err) {
        console.error("Helm loader error:", err);
      }
    }

    // Load individual skill
    function loadHelmSkill(skillConfig) {
      try {
        console.log(`Loading skill: ${skillConfig.id}`);
        
        // Create skill namespace if not exists
        if(!window.Helm.skills) {
          window.Helm.skills = {};
        }
        
        // Initialize skill with configuration
        window.Helm.skills[skillConfig.id] = {
          id: skillConfig.id,
          name: skillConfig.name,
          version: skillConfig.version,
          permissions: skillConfig.permissions,
          execute: async function(...args) {
            return await executeHelmSkill(skillConfig.id, args);
          },
          isAvailable: true,
          lastUsed: null
        };
        
        console.log(`Skill ${skillConfig.name} loaded successfully`);
      } catch(err) {
        console.error(`Failed to load skill ${skillConfig.id}:`, err);
      }
    }

    // Execute skill with permission check
    async function executeHelmSkill(skillId, args) {
      try {
        if(!window.Helm || !window.Helm.skills || !window.Helm.skills[skillId]) {
          throw new Error(`Skill ${skillId} not found`);
        }
        
        const skill = window.Helm.skills[skillId];
        
        // Check permissions
        if(!checkSkillPermissions(skillId)) {
          throw new Error(`Insufficient permissions for skill ${skillId}`);
        }
        
        // Execute skill
        const result = await skill.execute(...args);
        
        // Update last used timestamp
        skill.lastUsed = new Date().toISOString();
        
        // Log execution
        logSkillExecution(skillId, result);
        
        return result;
      } catch(err) {
        console.error(`Skill execution failed for ${skillId}:`, err);
        throw err;
      }
    }

    // Check skill permissions
    function checkSkillPermissions(skillId) {
      if(!window.Helm || !window.Helm.clientTier) {
        return false;
      }
      
      const skill = window.Helm.skills[skillId];
      const clientTier = window.Helm.clientTier;
      
      // Check if skill is allowed for client tier
      return skill.permissions && skill.permissions.includes(clientTier);
    }

    // Log skill execution
    function logSkillExecution(skillId, result) {
      if(!window.Helm || !window.Helm.logEndpoint) {
        return;
      }
      
      const logData = {
        skillId: skillId,
        timestamp: new Date().toISOString(),
        success: result.success !== false,
        result: result,
        clientTier: window.Helm.clientTier,
        userAgent: navigator.userAgent
      };
      
      // Send log to Helm API
      fetch(`${HELM_API_URL}/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": HELM_API_KEY
        },
        body: JSON.stringify(logData)
      }).catch(err => console.error("Failed to log execution:", err));
    }

    // Public API for external access
    window.HelmAPI = {
      execute: executeHelmSkill,
      getSkills: () => window.Helm ? Object.keys(window.Helm.skills) : [],
      getSkill: (skillId) => window.Helm && window.Helm.skills ? window.Helm.skills[skillId] : null,
      isSkillAvailable: (skillId) => checkSkillPermissions(skillId)
    };

    // Auto-initialize when DOM is ready
    if(document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initHelm);
    } else {
      initHelm();
    }
  })();
