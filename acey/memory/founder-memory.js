/**
 * Founder Memory Engine
 * Append-only memory system to prevent decision fatigue and rework
 */

const fs = require('fs');
const path = require('path');

class FounderMemory {
  constructor() {
    this.memoryPath = path.join(__dirname, '../data/memory.json');
    this.ensureMemoryFile();
  }

  ensureMemoryFile() {
    const dir = path.dirname(this.memoryPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!fs.existsSync(this.memoryPath)) {
      fs.writeFileSync(this.memoryPath, JSON.stringify({
        version: "1.0.0",
        created: new Date().toISOString(),
        memories: []
      }, null, 2));
    }
  }

  createMemory(type, summary, details = '', tags = []) {
    const memory = {
      id: `MEM-${Date.now()}`,
      type: type, // decision | rule | rejection | architecture | warning
      summary: summary,
      details: details,
      approved: true,
      created_by: "founder",
      confidence: 0.9,
      tags: tags,
      timestamp: new Date().toISOString(),
      superseded: null
    };

    this.addMemory(memory);
    return memory;
  }

  addMemory(memory) {
    const data = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
    data.memories.push(memory);
    fs.writeFileSync(this.memoryPath, JSON.stringify(data, null, 2));
  }

  searchMemories(query, type = null) {
    const data = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
    let memories = data.memories;

    if (type) {
      memories = memories.filter(m => m.type === type);
    }

    return memories.filter(m => 
      m.summary.toLowerCase().includes(query.toLowerCase()) ||
      m.details.toLowerCase().includes(query.toLowerCase()) ||
      m.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }

  getRecentMemories(count = 10) {
    const data = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
    return data.memories
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, count);
  }

  // Memory is append-only - never delete, only supersede
  supersedeMemory(memoryId, reason) {
    const data = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
    const memory = data.memories.find(m => m.id === memoryId);
    
    if (memory) {
      memory.superseded = {
        by: `MEM-${Date.now()}`,
        reason: reason,
        timestamp: new Date().toISOString()
      };
      fs.writeFileSync(this.memoryPath, JSON.stringify(data, null, 2));
    }
  }
}

module.exports = FounderMemory;
