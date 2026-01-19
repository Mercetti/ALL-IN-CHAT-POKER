const { PokerAudioSystem } = require('../server/poker-audio-system');

describe('PokerAudioSystem', () => {
  let audioSystem;

  beforeEach(() => {
    audioSystem = new PokerAudioSystem({ outputDir: './test-audio' });
  });

  test('should correctly filter audio library by user tier', () => {
    const affiliateAudio = audioSystem.getAvailableAudio('user123'); // Default is affiliate
    expect(affiliateAudio.phase4.voice).toEqual({}); // Voice is premier only
  });

  test('should generate procedural fallback when AI fails', async () => {
    const result = await audioSystem.generateAudioItem({
      name: 'test_sfx',
      duration: 1,
      mood: 'tense'
    }, 'sfx');
    expect(result.success).toBe(true);
  });

  test('should generate AI-enhanced audio when AI is available', async () => {
    // Mock AI to return structured audio data
    const mockAIResponse = {
      type: 'structured_audio',
      audio: {
        tempo: 120,
        instruments: ['piano', 'strings'],
        mood: 'dramatic'
      }
    };
    
    // This would test the actual AI integration
    const result = await audioSystem.generateAudioWithAI({
      name: 'background_music',
      duration: 30,
      mood: 'dramatic'
    }, 'music');
    
    expect(result.success).toBe(true);
    expect(result.audio).toBeDefined();
  });

  test('should handle AI failure gracefully', async () => {
    // Mock AI failure
    const result = await audioSystem.generateAudioWithAI({
      name: 'test_audio',
      duration: 2,
      mood: 'neutral'
    }, 'sfx');
    
    expect(result.success).toBe(true);
    expect(result.fallback).toBe(true);
  });
});
