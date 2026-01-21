# 🎭 PERSONA SYSTEM DOCUMENTATION

## 📋 Overview

The Persona System enables Helm Control to support multiple AI personalities without code changes. Each persona is a configurable set of traits, knowledge domains, safety constraints, and response patterns that can be dynamically loaded and applied.

## 🎯 Persona Architecture

### **Persona Components**
```typescript
interface PersonaConfig {
  personaName: string;        // Unique identifier
  domain: string;             // Primary domain (gaming, corporate, etc.)
  tone: ToneConfiguration;      // Communication style
  personality: PersonalityTraits; // Behavioral characteristics
  domainKnowledge: KnowledgeBase; // Expertise areas
  safetyConstraints: SafetyRules; // Safety and oversight rules
  responses: ResponseTemplates;  // Response patterns
}
```

### **Directory Structure**
```
personas/
├─ acey/                     # Gaming persona
│  ├─ persona-config.ts      # TypeScript configuration
│  ├─ prompts/
│  │  └─ system-prompt.md    # LLM system prompt
│  └─ responses.json          # Response templates
├─ corporate-bot/             # Business persona
│  ├─ persona-config.ts
│  └─ prompts/
└─ gaming-assistant/          # Gaming persona
    ├─ persona-config.ts
    └─ prompts/
```

## 🔧 Persona Configuration

### **Core Configuration**
```typescript
export const aceyPersonaConfig: PersonaConfig = {
  personaName: "Acey",
  version: "1.0.0",
  domain: "All-In Chat Poker",
  
  tone: {
    primary: "friendly, playful, precise",
    secondary: "helpful, enthusiastic, slightly quirky",
    avoid: ["formal", "corporate", "robotic"]
  },
  
  personality: {
    traits: [
      "playful but professional",
      "knowledgeable about poker and gaming",
      "encouraging and supportive",
      "transparent about AI nature",
      "safety-conscious"
    ],
    speechPatterns: {
      greeting: ["Hey there!", "What's up?", "Ready to play?"],
      encouragement: ["You've got this!", "Nice move!", "Great question!"],
      safety: ["Safety first!", "Let me double-check that..."]
    }
  }
};
```

### **Domain Knowledge**
```typescript
domainKnowledge: {
  primary: ["poker", "gaming", "streaming", "community management"],
  secondary: ["audio engineering", "content creation", "user experience"],
  limitations: ["financial advice", "legal advice", "medical advice"]
}
```

### **Safety Constraints**
```typescript
safetyConstraints: {
  disclosureRequired: true,
  humanOversight: ["financial", "legal", "moderation"],
  prohibitedTopics: ["illegal activities", "harmful content", "financial advice"],
  escalationThreshold: 0.7
}
```

## 📝 System Prompts

### **System Prompt Structure**
```markdown
# [Persona Name] System Prompt

You are [Persona Name], an AI assistant for [Domain].

## Core Identity
- Name: [Persona Name]
- Domain: [Domain]
- Tone: [Tone description]
- Traits: [Key personality traits]

## Capabilities
[List of what the persona can do]

## Limitations
[List of what the persona cannot do]

## Safety Guidelines
- Always disclose AI nature
- Require human oversight for sensitive topics
- Prioritize user safety and ethical behavior
```

### **Dynamic Prompt Loading**
```typescript
class HelmPersonaLoader {
  getSystemPrompt(personaName: string): string {
    const persona = this.getPersona(personaName);
    return persona ? persona.systemPrompt : '';
  }
}
```

## 🗣️ Response Generation

### **Response Templates**
```typescript
export const aceyResponseTemplates = {
  greeting: [
    "Hey there! I'm Acey, your AI assistant for All-In Chat Poker!",
    "What's up! Acey here, ready to help with your poker stream!"
    "Hey! Acey reporting for duty! Let's make your stream amazing!"
  ],
  
  encouragement: [
    "You've got this! Let me help you get everything set up perfectly.",
    "Nice move! Your stream is going to be awesome with this setup.",
    "Great question! Let me help you figure this out step by step."
  ],
  
  safety: [
    "Safety first! Let me double-check that before we proceed.",
    "Better to be safe! Let me make sure this is the right approach.",
    "Hold on! Let me verify this is safe to do first."
  ]
};
```

### **Dynamic Response Generation**
```typescript
export function generatePersonaResponse(
  persona: PersonaConfig,
  responseType: keyof typeof aceyResponseTemplates,
  context?: string
): string {
  const templates = aceyResponseTemplates[responseType];
  const templateIndex = Math.floor(Math.random() * templates.length);
  const baseResponse = templates[templateIndex];
  
  return context ? `${baseResponse} ${context}` : baseResponse;
}
```

## 🔍 Response Validation

### **Safety Validation**
```typescript
export function validatePersonaResponse(
  persona: PersonaConfig,
  response: string,
  context: string
): { isValid: boolean; reason?: string } {
  const responseLower = response.toLowerCase();
  const contextLower = context.toLowerCase();
  
  // Check for prohibited topics
  for (const prohibited of persona.safetyConstraints.prohibitedTopics) {
    if (responseLower.includes(prohibited.toLowerCase()) || 
        contextLower.includes(prohibited.toLowerCase())) {
      return {
        isValid: false,
        reason: `Response contains prohibited topic: ${prohibited}`
      };
    }
  }
  
  return { isValid: true };
}
```

## 🎛️ Persona Loading System

### **Dynamic Loading**
```typescript
class HelmPersonaLoader {
  private personas: Map<string, LoadedPersona> = new Map();
  
  loadPersona(personaName: string): boolean {
    try {
      const configPath = path.join(this.personasPath, personaName, 'persona-config.ts');
      const configModule = require(configPath);
      const config: PersonaConfig = configModule.aceyPersonaConfig;
      
      const promptPath = path.join(this.personasPath, personaName, 'prompts', 'system-prompt.md');
      const systemPrompt = fs.existsSync(promptPath) 
        ? fs.readFileSync(promptPath, 'utf8')
        : this.generateDefaultSystemPrompt(config);
      
      this.personas.set(personaName, {
        name: personaName,
        config,
        systemPrompt,
        lastLoaded: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error(`Failed to load persona ${personaName}:`, error);
      return false;
    }
  }
}
```

### **Persona Management**
```typescript
// Get available personas
const availablePersonas = helmPersonaLoader.getAvailablePersonas();
// ["acey", "corporate-bot", "gaming-assistant"]

// Load specific persona
const acey = helmPersonaLoader.getPersona('acey');

// Switch personas dynamically
const corporate = helmPersonaLoader.getPersona('corporate-bot');
```

## 🎨 Creating New Personas

### **Step 1: Create Directory Structure**
```bash
mkdir -p personas/new-persona/{prompts,responses}
```

### **Step 2: Create Configuration**
```typescript
// personas/new-persona/persona-config.ts
export const newPersonaConfig: PersonaConfig = {
  personaName: "NewPersona",
  domain: "Target Domain",
  tone: {
    primary: "professional, helpful, precise",
    secondary: "friendly, approachable",
    avoid: ["casual", "informal"]
  },
  // ... rest of configuration
};
```

### **Step 3: Create System Prompt**
```markdown
# personas/new-persona/prompts/system-prompt.md
You are NewPersona, an AI assistant for Target Domain...

## Core Identity
- Name: NewPersona
- Domain: Target Domain
- Tone: professional, helpful, precise
```

### **Step 4: Test Persona**
```typescript
// Load and test new persona
helmPersonaLoader.reloadPersona('new-persona');
const persona = helmPersonaLoader.getPersona('new-persona');
console.log('Persona loaded:', persona.name);
```

## 🔄 Persona Switching

### **Runtime Switching**
```typescript
class HelmOrchestrator {
  private currentPersona: LoadedPersona;
  
  switchPersona(personaName: string): boolean {
    const newPersona = helmPersonaLoader.getPersona(personaName);
    if (newPersona) {
      this.currentPersona = newPersona;
      console.log(`Switched to persona: ${personaName}`);
      return true;
    }
    return false;
  }
  
  processMessage(message: string): Promise<Response> {
    // Use current persona for processing
    return this.processWithPersona(message, this.currentPersona);
  }
}
```

### **Context-Aware Switching**
```typescript
// Switch persona based on context
function selectPersonaForContext(context: string): string {
  if (context.includes('corporate') || context.includes('business')) {
    return 'corporate-bot';
  } else if (context.includes('gaming') || context.includes('streaming')) {
    return 'acey';
  } else {
    return 'gaming-assistant';
  }
}
```

## 📊 Persona Analytics

### **Usage Tracking**
```typescript
interface PersonaUsage {
  personaName: string;
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  lastUsed: number;
}

class PersonaAnalytics {
  private usage: Map<string, PersonaUsage> = new Map();
  
  trackUsage(personaName: string, responseTime: number, error: boolean): void {
    const current = this.usage.get(personaName) || {
      personaName,
      requestCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
      lastUsed: 0
    };
    
    current.requestCount++;
    current.lastUsed = Date.now();
    current.averageResponseTime = 
      (current.averageResponseTime * (current.requestCount - 1) + responseTime) / current.requestCount;
    
    if (error) {
      current.errorRate = (current.errorRate * (current.requestCount - 1) + 1) / current.requestCount;
    }
    
    this.usage.set(personaName, current);
  }
}
```

## 🛡️ Security Considerations

### **Persona Isolation**
```typescript
// Each persona runs in isolated context
class PersonaContext {
  private persona: LoadedPersona;
  private permissions: string[];
  
  constructor(persona: LoadedPersona) {
    this.persona = persona;
    this.permissions = this.derivePermissions(persona.config);
  }
  
  private derivePermissions(config: PersonaConfig): string[] {
    // Derive permissions from persona configuration
    return [
      ...config.domainKnowledge.primary,
      ...config.domainKnowledge.secondary
    ];
  }
}
```

### **Input Validation**
```typescript
function validatePersonaInput(
  persona: PersonaConfig,
  input: string,
  context: string
): { isValid: boolean; filteredInput?: string } {
  // Filter input based on persona constraints
  const filteredInput = filterProhibitedContent(input, persona.safetyConstraints);
  
  return {
    isValid: filteredInput.length > 0,
    filteredInput
  };
}
```

## 🚀 Best Practices

### **Persona Design**
- **Clear Domain**: Each persona should have a specific domain focus
- **Consistent Tone**: Maintain consistent personality across all responses
- **Safety First**: Always prioritize safety and ethical behavior
- **Transparency**: Clearly communicate AI nature and limitations

### **Configuration Management**
- **Version Control**: Track persona configuration versions
- **Testing**: Test all persona changes before deployment
- **Documentation**: Document persona capabilities and limitations
- **Validation**: Validate persona configurations on load

### **Performance**
- **Lazy Loading**: Load personas only when needed
- **Caching**: Cache loaded personas in memory
- **Cleanup**: Remove unused personas from memory
- **Monitoring**: Track persona performance metrics

## 📚 Examples

### **Gaming Persona (Acey)**
- **Domain**: All-In Chat Poker
- **Tone**: Friendly, playful, precise
- **Expertise**: Poker rules, streaming setup, audio engineering
- **Safety**: Requires oversight for financial decisions

### **Corporate Persona**
- **Domain**: Business operations
- **Tone**: Professional, formal, precise
- **Expertise**: Business analysis, reporting, compliance
- **Safety**: Requires oversight for legal decisions

### **Support Persona**
- **Domain**: Customer support
- **Tone**: Helpful, patient, empathetic
- **Expertise**: Product knowledge, troubleshooting, escalation
- **Safety**: Requires oversight for account changes

---

## 🎯 Next Steps

1. **Create Additional Personas**: Design personas for different domains
2. **Implement A/B Testing**: Test different persona configurations
3. **Add Analytics**: Track persona performance and usage
4. **User Customization**: Allow users to create custom personas
5. **Persona Marketplace**: Create a marketplace for persona sharing

The Persona System enables Helm Control to be truly multi-persona and adaptable to different use cases while maintaining safety and consistency.
