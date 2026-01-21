/**
 * Helm Persona Loader
 * Dynamically loads and manages persona configurations for the Helm Control engine
 */

import { PersonaConfig, loadPersonaConfig, generatePersonaResponse, validatePersonaResponse } from '../../personas/acey/persona-config';
import * as fs from 'fs';
import * as path from 'path';

export interface LoadedPersona {
  name: string;
  config: PersonaConfig;
  systemPrompt: string;
  lastLoaded: number;
}

export class HelmPersonaLoader {
  private personas: Map<string, LoadedPersona> = new Map();
  private personasPath: string;
  private defaultPersona: string = 'acey';

  constructor(personasPath: string = './personas') {
    this.personasPath = personasPath;
    this.loadAllPersonas();
  }

  /**
   * Load all available personas from the personas directory
   */
  private loadAllPersonas(): void {
    try {
      const personaDirs = fs.readdirSync(this.personasPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const personaName of personaDirs) {
        this.loadPersona(personaName);
      }

      console.log(`🎭 Loaded ${this.personas.size} personas: ${Array.from(this.personas.keys()).join(', ')}`);
    } catch (error) {
      console.error('❌ Failed to load personas:', error);
    }
  }

  /**
   * Load a specific persona
   */
  private loadPersona(personaName: string): boolean {
    try {
      const personaPath = path.join(this.personasPath, personaName);
      
      // Load persona configuration
      const configPath = path.join(personaPath, 'persona-config.ts');
      if (!fs.existsSync(configPath)) {
        console.warn(`⚠️ Persona config not found: ${configPath}`);
        return false;
      }

      // Dynamic import of persona config
      const configModule = require(configPath);
      const config: PersonaConfig = configModule.aceyPersonaConfig || configModule[`${personaName}PersonaConfig`];

      if (!config) {
        console.warn(`⚠️ No valid config found for persona: ${personaName}`);
        return false;
      }

      // Load system prompt
      const promptPath = path.join(personaPath, 'prompts', 'system-prompt.md');
      let systemPrompt = '';
      
      if (fs.existsSync(promptPath)) {
        systemPrompt = fs.readFileSync(promptPath, 'utf8');
      } else {
        console.warn(`⚠️ System prompt not found: ${promptPath}`);
        systemPrompt = this.generateDefaultSystemPrompt(config);
      }

      // Store loaded persona
      this.personas.set(personaName, {
        name: personaName,
        config,
        systemPrompt,
        lastLoaded: Date.now()
      });

      console.log(`✅ Loaded persona: ${personaName}`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to load persona ${personaName}:`, error);
      return false;
    }
  }

  /**
   * Get a loaded persona by name
   */
  public getPersona(personaName?: string): LoadedPersona | null {
    const name = personaName || this.defaultPersona;
    return this.personas.get(name) || null;
  }

  /**
   * Get the default persona
   */
  public getDefaultPersona(): LoadedPersona | null {
    return this.getPersona(this.defaultPersona);
  }

  /**
   * Get all available persona names
   */
  public getAvailablePersonas(): string[] {
    return Array.from(this.personas.keys());
  }

  /**
   * Reload a specific persona
   */
  public reloadPersona(personaName: string): boolean {
    this.personas.delete(personaName);
    return this.loadPersona(personaName);
  }

  /**
   * Reload all personas
   */
  public reloadAllPersonas(): void {
    this.personas.clear();
    this.loadAllPersonas();
  }

  /**
   * Generate a response using the persona's configuration
   */
  public generateResponse(
    personaName: string,
    responseType: string,
    context?: string
  ): string {
    const persona = this.getPersona(personaName);
    if (!persona) {
      return `Persona "${personaName}" not found.`;
    }

    // Use the persona's response generation logic
    try {
      const configModule = require(path.join(this.personasPath, personaName, 'persona-config.ts'));
      if (configModule.generatePersonaResponse) {
        return configModule.generatePersonaResponse(persona.config, responseType as any, context);
      }
    } catch (error) {
      console.error(`❌ Failed to generate response for persona ${personaName}:`, error);
    }

    // Fallback to simple response
    return persona.config.responses.greeting;
  }

  /**
   * Validate a response against persona constraints
   */
  public validateResponse(
    personaName: string,
    response: string,
    context: string
  ): { isValid: boolean; reason?: string } {
    const persona = this.getPersona(personaName);
    if (!persona) {
      return { isValid: false, reason: `Persona "${personaName}" not found.` };
    }

    // Use the persona's validation logic
    try {
      const configModule = require(path.join(this.personasPath, personaName, 'persona-config.ts'));
      if (configModule.validatePersonaResponse) {
        return configModule.validatePersonaResponse(persona.config, response, context);
      }
    } catch (error) {
      console.error(`❌ Failed to validate response for persona ${personaName}:`, error);
    }

    // Fallback validation
    return { isValid: true };
  }

  /**
   * Get persona statistics
   */
  public getPersonaStats(): {
    totalPersonas: number;
    defaultPersona: string;
    personas: Array<{
      name: string;
      lastLoaded: number;
      hasSystemPrompt: boolean;
    }>;
  } {
    const personas = Array.from(this.personas.values()).map(persona => ({
      name: persona.name,
      lastLoaded: persona.lastLoaded,
      hasSystemPrompt: !!persona.systemPrompt
    }));

    return {
      totalPersonas: this.personas.size,
      defaultPersona: this.defaultPersona,
      personas
    };
  }

  /**
   * Generate a default system prompt if none exists
   */
  private generateDefaultSystemPrompt(config: PersonaConfig): string {
    return `# ${config.personaName} System Prompt

You are ${config.personaName}, an AI assistant for ${config.domain}.

## Core Identity
- Name: ${config.personaName}
- Domain: ${config.domain}
- Tone: ${config.tone.primary}
- Traits: ${config.personality.traits.join(', ')}

## Capabilities
${config.domainKnowledge.primary.map((capability: string) => `- ${capability}`).join('\n')}

## Limitations
${config.domainKnowledge.limitations.map((limitation: string) => `- ${limitation}`).join('\n')}

## Safety Guidelines
- Always disclose AI nature
- Require human oversight for sensitive topics
- Prioritize user safety and ethical behavior

---
*Auto-generated system prompt for ${config.personaName}*`;
  }

  /**
   * Set the default persona
   */
  public setDefaultPersona(personaName: string): boolean {
    if (this.personas.has(personaName)) {
      this.defaultPersona = personaName;
      console.log(`🎭 Default persona set to: ${personaName}`);
      return true;
    }
    console.warn(`⚠️ Persona "${personaName}" not found, cannot set as default`);
    return false;
  }

  /**
   * Check if a persona exists
   */
  public hasPersona(personaName: string): boolean {
    return this.personas.has(personaName);
  }

  /**
   * Get persona configuration for external use
   */
  public getPersonaConfig(personaName?: string): PersonaConfig | null {
    const persona = this.getPersona(personaName);
    return persona ? persona.config : null;
  }

  /**
   * Get system prompt for external use
   */
  public getSystemPrompt(personaName?: string): string {
    const persona = this.getPersona(personaName);
    return persona ? persona.systemPrompt : '';
  }
}

// Export singleton instance for easy use
export const helmPersonaLoader = new HelmPersonaLoader();
