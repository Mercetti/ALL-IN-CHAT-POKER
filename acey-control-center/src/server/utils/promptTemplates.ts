import { AudioTaskContext, CodingTaskContext } from "./enhancedSchema";

export class PromptTemplates {
  // Audio Generation Templates
  
  static getAudioPrompt(context: AudioTaskContext): string {
    const basePrompt = this.getAudioBasePrompt(context);
    const contextInfo = this.formatAudioContext(context);
    const constraints = this.getAudioConstraints(context);
    
    return `${basePrompt}\n\n${contextInfo}\n\n${constraints}`;
  }

  private static getAudioBasePrompt(context: AudioTaskContext): string {
    switch (context.type) {
      case "speech":
        return this.getSpeechPrompt(context);
      case "music":
        return this.getMusicPrompt(context);
      case "effect":
        return this.getEffectPrompt(context);
      default:
        return "Generate audio content based on the provided context.";
    }
  }

  private static getSpeechPrompt(context: AudioTaskContext): string {
    const voiceMap = {
      energetic: "energetic, enthusiastic, high-energy, engaging",
      calm: "calm, soothing, gentle, reassuring",
      professional: "professional, clear, authoritative, polished",
      playful: "playful, fun, lighthearted, cheerful"
    };

    const moodMap = {
      hype: "exciting, thrilling, intense, celebratory",
      calm: "relaxed, peaceful, soothing, gentle",
      neutral: "balanced, steady, moderate, even-keeled"
    };

    return `Generate a ${context.mood} ${voiceMap[context.voice || 'energetic']} voice line for Twitch/game commentary.

Voice characteristics: ${voiceMap[context.voice || 'energetic']}
Mood: ${moodMap[context.mood]}
Length: ${context.lengthSeconds || 3} seconds maximum
Format: Clear, concise, suitable for TTS synthesis

The speech should be:
- Perfect for live streaming
- Easy to understand
- Engaging and entertaining
- Appropriate for gaming content
- ${context.lengthSeconds ? `Exactly ${context.lengthSeconds} seconds` : 'Under 5 seconds'}

Return only the spoken text, no additional commentary.`;
  }

  private static getMusicPrompt(context: AudioTaskContext): string {
    const moodMap = {
      hype: "upbeat, energetic, celebratory, exciting",
      calm: "relaxing, peaceful, ambient, soothing",
      neutral: "balanced, steady, neutral, background"
    };

    const intensityMap = {
      low: "subtle, gentle, quiet, understated",
      medium: "moderate, balanced, present but not overwhelming",
      high: "bold, dynamic, attention-grabbing, impactful"
    };

    return `Generate a ${moodMap[context.mood]} ${intensityMap[context.intensity || 'medium']} background music track.

Music specifications:
- Duration: ${context.lengthSeconds || 10} seconds
- Mood: ${moodMap[context.mood]}
- Intensity: ${intensityMap[context.intensity || 'medium']}
- Format: ${context.format || 'MP3'}
- Sample Rate: ${context.sampleRate || 44100} Hz
- Channels: ${context.channels || 2} (stereo)
- Volume: ${context.volume || 0.7} (normalized)

The music should be:
- Perfect for streaming background
- Loopable if needed
- Non-distracting but engaging
- High quality production
- ${context.targetFileName ? `Named "${context.targetFileName}"` : 'Suitable for the context'}

Return a description of the music that would be suitable for audio generation, including tempo, instruments, and mood.`;
  }

  private static getEffectPrompt(context: AudioTaskContext): string {
    const moodMap = {
      hype: "exciting, celebratory, attention-grabbing",
      calm: "gentle, soothing, subtle, peaceful",
      neutral: "balanced, functional, clear, standard"
    };

    return `Generate a ${moodMap[context.mood]} sound effect for ${context.type === 'effect' ? 'gaming/streaming' : 'notification'} purposes.

Sound effect specifications:
- Duration: ${context.lengthSeconds || 2} seconds
- Mood: ${moodMap[context.mood]}
- Intensity: ${context.intensity || 'medium'}
- Format: ${context.format || 'WAV'}
- Sample Rate: ${context.sampleRate || 44100} Hz
- Volume: ${context.volume || 0.8} (normalized)

The effect should be:
- High quality and professional
- Clear and distinctive
- Appropriate for the context
- ${context.targetFileName ? `Named "${context.targetFileName}"` : 'Suitable for streaming'}

Return a description of the sound effect, including the type of sound, characteristics, and technical specifications.`;
  }

  private static formatAudioContext(context: AudioTaskContext): string {
    const contextInfo: string[] = [];
    
    if (context.context) {
      if (context.context.gameState) {
        contextInfo.push(`Game State: ${JSON.stringify(context.context.gameState)}`);
      }
      if (context.context.player) {
        contextInfo.push(`Player: ${context.context.player}`);
      }
      if (context.context.pot) {
        contextInfo.push(`Pot Size: ${context.context.pot} chips`);
      }
      if (context.context.chatExcitement) {
        contextInfo.push(`Chat Excitement Level: ${context.context.chatExcitement}/10`);
      }
      if (context.context.subscriberCount) {
        contextInfo.push(`Subscriber Count: ${context.context.subscriberCount}`);
      }
      if (context.context.donationAmount) {
        contextInfo.push(`Donation Amount: $${context.context.donationAmount}`);
      }
    }
    
    return contextInfo.length > 0 ? `Context:\n${contextInfo.join('\n')}` : '';
  }

  private static getAudioConstraints(context: AudioTaskContext): string {
    const constraints: string[] = [
      "Content must be appropriate for all audiences",
      "No copyrighted material",
      "Original and unique",
      "High quality production value"
    ];
    
    if (context.type === "speech") {
      constraints.push(
        "No profanity or inappropriate language",
        "Family-friendly content",
        "Positive and engaging tone"
      );
    }
    
    return `Constraints:\n${constraints.join('\n')}`;
  }

  // Coding Generation Templates
  
  static getCodingPrompt(context: CodingTaskContext): string {
    const basePrompt = this.getCodingBasePrompt(context);
    const contextInfo = this.formatCodingContext(context);
    const constraints = this.getCodingConstraints(context);
    
    return `${basePrompt}\n\n${contextInfo}\n\n${constraints}`;
  }

  private static getCodingBasePrompt(context: CodingTaskContext): string {
    const languageMap = {
      typescript: "TypeScript with strict typing",
      python: "Python with type hints",
      javascript: "Modern JavaScript (ES6+)",
      bash: "Bash shell script",
      sql: "SQL query",
      html: "HTML5 semantic markup",
      css: "CSS3 with modern features"
    };

    let prompt = `Write ${languageMap[context.language]} code for: ${context.description}`;

    if (context.functionName) {
      prompt += `\n\nFunction name: ${context.functionName}`;
    }

    if (context.maxLines) {
      prompt += `\n\nMaximum lines: ${context.maxLines}`;
    }

    if (context.framework) {
      prompt += `\n\nFramework: ${context.framework}`;
    }

    if (context.dependencies && context.dependencies.length > 0) {
      prompt += `\n\nDependencies: ${context.dependencies.join(', ')}`;
    }

    return prompt;
  }

  private static formatCodingContext(context: CodingTaskContext): string {
    const contextInfo: string[] = [];
    
    if (context.inputs) {
      contextInfo.push(`Input: ${JSON.stringify(context.inputs, null, 2)}`);
    }
    
    if (context.outputs) {
      contextInfo.push(`Output: ${JSON.stringify(context.outputs, null, 2)}`);
    }
    
    if (context.filePath) {
      contextInfo.push(`File path: ${context.filePath}`);
    }

    return contextInfo.length > 0 ? `Context:\n${contextInfo.join('\n')}` : '';
  }

  private static getCodingConstraints(context: CodingTaskContext): string {
    const constraints: string[] = [
      "Code must be production-ready",
      "Follow best practices and conventions",
      "Include proper error handling",
      "Add comprehensive comments",
      "No hardcoded values unless specified"
    ];

    if (context.language === "typescript" || context.language === "javascript") {
      constraints.push("Use modern ES6+ syntax");
      constraints.push("Include JSDoc comments for functions");
    }

    if (context.language === "python") {
      constraints.push("Use type hints");
      constraints.push("Follow PEP 8 style guide");
    }

    if (context.validationRules && context.validationRules.length > 0) {
      constraints.push(`Validation rules: ${context.validationRules.map(rule => rule.rule).join(', ')}`);
    }

    if (context.testCases && context.testCases.length > 0) {
      constraints.push(`Test cases: ${context.testCases.map(tc => tc.description).join(', ')}`);
    }

    return `Constraints:\n${constraints.join('\n')}`;
  }

  // Specialized Templates

  static getBugFixPrompt(context: CodingTaskContext): string {
    return `Write a ${context.language} function to ${context.description}.

Requirements:
- Maximum ${context.maxLines || 30} lines
- Input: ${JSON.stringify(context.inputs || 'string message')}
- Output: ${JSON.stringify(context.outputs || 'boolean isValid')}
- Ensure safe characters only
- Include comprehensive JSDoc comments
- Add input validation
- Handle edge cases gracefully
- Return boolean result

Example usage:
${context.inputs ? `const result = ${context.functionName || 'validateInput'}(${JSON.stringify(context.inputs)});` : ''}

The function should be:
- Secure against injection attacks
- Perform thorough validation
- Be well-documented
- Easy to understand and maintain`;
  }

  static getAssetAutomationPrompt(context: CodingTaskContext): string {
    return `Generate a Node.js script that ${context.description}.

Requirements:
- Use modern Node.js features
- Include proper error handling
- Add progress indicators
- Support batch processing
- Include command-line arguments
- Log operations clearly
- Handle file system operations safely

Script should:
- Process files in specified directory
- Convert images to 512x512 PNG format
- Maintain transparency
- Preserve aspect ratio when possible
- Generate output in organized structure
- Handle various image formats
- Include validation checks

The script should be:
- Robust and production-ready
- Well-documented
- Easy to use and modify
- Include proper error handling`;
  }

  static getValidationPrompt(context: CodingTaskContext): string {
    return `Generate validation code for ${context.description}.

Validation requirements:
- ${context.validationRules?.map(rule => `${rule.type}: ${rule.rule} (${rule.severity})`).join('\n') || 'Standard validation rules'}
- Comprehensive error reporting
- Performance optimized
- Security focused

Validation should check:
- Syntax correctness
- Security vulnerabilities
- Performance issues
- Code style compliance
- Edge cases

Return structured validation results with:
- Overall validity status
- Detailed error messages
- Line numbers for issues
- Severity levels
- Suggestions for fixes`;
  }

  // Feedback Integration Templates

  static getFeedbackAnalysisPrompt(feedback: any): string {
    return `Analyze the following feedback data and provide adaptation recommendations:

Feedback Data:
${JSON.stringify(feedback, null, 2)}

Provide recommendations for:
1. Trust score adjustments
2. Confidence level modifications
3. Mood/persona changes
4. Preference updates
5. Future prompt improvements

Consider:
- Engagement metrics
- Quality indicators
- User satisfaction
- Performance impact
- Learning opportunities

Return structured recommendations with specific numeric adjustments and reasoning.`;
  }

  static getAdaptationPrompt(currentPerformance: any, targetGoals: any): string {
    return `Based on current performance and target goals, generate adaptation recommendations:

Current Performance:
${JSON.stringify(currentPerformance, null, 2)}

Target Goals:
${JSON.stringify(targetGoals, null, 2)}

Provide specific adjustments for:
1. Trust score delta
2. Confidence level changes
3. Mood/persona modifications
4. Prompt template improvements
5. Task type preferences

Consider:
- Performance gaps
- User feedback patterns
- Engagement metrics
- Quality indicators
- Learning objectives

Return actionable adaptation plan with specific numeric values and implementation steps.`;
  }
}
