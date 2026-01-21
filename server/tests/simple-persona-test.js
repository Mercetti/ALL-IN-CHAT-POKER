/**
 * Simple Persona Test
 * Tests persona files with absolute paths
 */

const path = require('path');
const fs = require('fs');

console.log('🎭 Testing Persona Files...');

// Use absolute paths
const projectRoot = path.resolve(__dirname, '..');
const personaConfigPath = path.join(projectRoot, 'personas', 'acey', 'persona-config.ts');
const systemPromptPath = path.join(projectRoot, 'personas', 'acey', 'prompts', 'system-prompt.md');
const personaLoaderPath = path.join(__dirname, 'personas', 'helmPersonaLoader.ts');

console.log('🔍 Checking paths:');
console.log('Project root:', projectRoot);
console.log('Persona config:', personaConfigPath);
console.log('System prompt:', systemPromptPath);
console.log('Persona loader:', personaLoaderPath);

// Test persona config
if (fs.existsSync(personaConfigPath)) {
  const stats = fs.statSync(personaConfigPath);
  console.log(`✅ Persona config exists (${stats.size} bytes)`);
  
  const content = fs.readFileSync(personaConfigPath, 'utf8');
  if (content.includes('aceyPersonaConfig')) {
    console.log('✅ Contains aceyPersonaConfig');
  }
} else {
  console.log('❌ Persona config missing');
}

// Test system prompt
if (fs.existsSync(systemPromptPath)) {
  const stats = fs.statSync(systemPromptPath);
  console.log(`✅ System prompt exists (${stats.size} bytes)`);
  
  const content = fs.readFileSync(systemPromptPath, 'utf8');
  if (content.includes('# Acey System Prompt')) {
    console.log('✅ Contains system prompt header');
  }
} else {
  console.log('❌ System prompt missing');
}

// Test persona loader
if (fs.existsSync(personaLoaderPath)) {
  const stats = fs.statSync(personaLoaderPath);
  console.log(`✅ Persona loader exists (${stats.size} bytes)`);
} else {
  console.log('❌ Persona loader missing');
}

console.log('\n🎉 Persona Test Complete!');
