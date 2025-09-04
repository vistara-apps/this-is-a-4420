import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || 'placeholder-key',
  dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
});

/**
 * Anthropic Service for Ad Copy Generation
 * Uses Claude for creating engaging ad copy
 */

export class AnthropicService {
  constructor() {
    if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
      console.warn('Anthropic API key not found. Copy generation will use fallback.');
    }
  }

  /**
   * Generate ad copy using Claude
   * @param {Object} params - Generation parameters
   * @param {string} params.productDescription - Description of the product
   * @param {string} params.platform - Target platform (instagram, tiktok, etc.)
   * @param {string} params.adType - Type of ad (feed, story, etc.)
   * @param {string} params.tone - Tone of voice (casual, professional, etc.)
   * @param {string} params.targetAudience - Target audience description
   * @returns {Promise<Object>} Generated copy data
   */
  async generateAdCopy({
    productDescription,
    platform = 'instagram',
    adType = 'feed',
    tone = 'engaging',
    targetAudience = 'general',
    includeHashtags = true,
    includeEmojis = true
  }) {
    try {
      if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
        throw new Error('Anthropic API key not configured');
      }

      const prompt = this.createCopyPrompt({
        productDescription,
        platform,
        adType,
        tone,
        targetAudience,
        includeHashtags,
        includeEmojis
      });

      console.log('Generating copy with prompt:', prompt);

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      if (!response.content || response.content.length === 0) {
        throw new Error('No copy generated');
      }

      const generatedCopy = response.content[0].text.trim();
      
      return {
        copy: generatedCopy,
        platform,
        adType,
        tone,
        cost: this.calculateCopyCost(response.usage),
        generatedAt: new Date().toISOString(),
        usage: response.usage
      };

    } catch (error) {
      console.error('Anthropic copy generation error:', error);
      
      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      
      if (error.status === 401) {
        throw new Error('Invalid API key. Please check your Anthropic configuration.');
      }
      
      if (error.status === 400) {
        throw new Error('Invalid request. Please check your input parameters.');
      }
      
      throw new Error(`Copy generation failed: ${error.message}`);
    }
  }

  /**
   * Create optimized prompt for copy generation
   */
  createCopyPrompt({
    productDescription,
    platform,
    adType,
    tone,
    targetAudience,
    includeHashtags,
    includeEmojis
  }) {
    const platformSpecs = {
      instagram: {
        feed: {
          maxLength: 2200,
          style: 'Visual storytelling, engaging captions',
          features: 'hashtags, emojis, call-to-action'
        },
        story: {
          maxLength: 160,
          style: 'Short, punchy, immediate action',
          features: 'minimal text, strong CTA'
        },
        reel: {
          maxLength: 300,
          style: 'Trendy, viral-worthy, hook-focused',
          features: 'trending phrases, emojis'
        }
      },
      tiktok: {
        feed: {
          maxLength: 300,
          style: 'Viral, trendy, Gen-Z friendly',
          features: 'trending hashtags, slang, hooks'
        },
        story: {
          maxLength: 150,
          style: 'Quick, attention-grabbing',
          features: 'minimal text, strong hook'
        }
      },
      facebook: {
        feed: {
          maxLength: 500,
          style: 'Conversational, community-focused',
          features: 'questions, engagement prompts'
        },
        story: {
          maxLength: 200,
          style: 'Personal, direct',
          features: 'clear CTA'
        }
      },
      twitter: {
        feed: {
          maxLength: 280,
          style: 'Concise, witty, shareable',
          features: 'hashtags, mentions'
        }
      },
      linkedin: {
        feed: {
          maxLength: 1300,
          style: 'Professional, value-driven',
          features: 'industry insights, professional tone'
        }
      }
    };

    const toneDescriptors = {
      casual: 'casual, friendly, conversational',
      professional: 'professional, authoritative, trustworthy',
      engaging: 'engaging, enthusiastic, compelling',
      playful: 'playful, fun, lighthearted',
      urgent: 'urgent, action-oriented, time-sensitive',
      luxurious: 'premium, exclusive, sophisticated',
      educational: 'informative, helpful, educational'
    };

    const audienceDescriptors = {
      general: 'general audience',
      'young-adults': 'young adults (18-30)',
      'professionals': 'working professionals',
      'parents': 'parents and families',
      'entrepreneurs': 'entrepreneurs and business owners',
      'students': 'students and learners'
    };

    const spec = platformSpecs[platform]?.[adType] || platformSpecs[platform]?.feed;
    const toneDesc = toneDescriptors[tone] || toneDescriptors.engaging;
    const audienceDesc = audienceDescriptors[targetAudience] || audienceDescriptors.general;

    let prompt = `Create compelling ad copy for ${platform} ${adType} promoting: ${productDescription}\n\n`;
    prompt += `Requirements:\n`;
    prompt += `- Platform: ${platform} ${adType}\n`;
    prompt += `- Max length: ${spec?.maxLength || 300} characters\n`;
    prompt += `- Tone: ${toneDesc}\n`;
    prompt += `- Target audience: ${audienceDesc}\n`;
    prompt += `- Style: ${spec?.style || 'engaging social media copy'}\n`;
    
    if (includeHashtags && platform !== 'linkedin') {
      prompt += `- Include relevant hashtags\n`;
    }
    
    if (includeEmojis && ['instagram', 'tiktok', 'facebook'].includes(platform)) {
      prompt += `- Include appropriate emojis\n`;
    }
    
    prompt += `- Include a clear call-to-action\n`;
    prompt += `- Make it ${spec?.features || 'engaging and shareable'}\n\n`;
    
    prompt += `Generate only the ad copy text, no explanations or additional formatting.`;

    return prompt;
  }

  /**
   * Calculate cost for copy generation
   */
  calculateCopyCost(usage) {
    if (!usage) return 0.001; // Fallback cost
    
    // Claude 3 Haiku pricing (as of 2024)
    const inputCostPer1K = 0.00025;  // $0.25 per 1M input tokens
    const outputCostPer1K = 0.00125; // $1.25 per 1M output tokens
    
    const inputCost = (usage.input_tokens / 1000) * inputCostPer1K;
    const outputCost = (usage.output_tokens / 1000) * outputCostPer1K;
    
    return inputCost + outputCost;
  }

  /**
   * Generate multiple copy variations
   */
  async generateCopyVariations({
    productDescription,
    platforms = ['instagram'],
    variationCount = 3,
    tone = 'engaging',
    targetAudience = 'general'
  }) {
    const variations = [];
    const errors = [];

    for (let i = 0; i < variationCount; i++) {
      const platform = platforms[i % platforms.length];
      const adTypes = ['feed', 'story'];
      const adType = adTypes[i % adTypes.length];
      
      // Vary tone for different variations
      const tones = ['engaging', 'casual', 'professional', 'playful'];
      const variationTone = i === 0 ? tone : tones[i % tones.length];

      try {
        const variation = await this.generateAdCopy({
          productDescription,
          platform,
          adType,
          tone: variationTone,
          targetAudience
        });
        
        variations.push({
          ...variation,
          variationIndex: i
        });

        // Add small delay to respect rate limits
        if (i < variationCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error) {
        console.error(`Copy variation ${i} failed:`, error);
        errors.push({
          variationIndex: i,
          error: error.message
        });
      }
    }

    return {
      variations,
      errors,
      totalCost: variations.reduce((sum, v) => sum + v.cost, 0)
    };
  }

  /**
   * Generate copy for specific creative brief
   */
  async generateCreativeBrief({
    productDescription,
    platform,
    adType,
    campaignGoal = 'awareness',
    keyMessage = '',
    targetAudience = 'general'
  }) {
    try {
      const prompt = `Create a creative brief for a ${platform} ${adType} ad campaign.

Product: ${productDescription}
Campaign Goal: ${campaignGoal}
Key Message: ${keyMessage || 'Highlight product benefits'}
Target Audience: ${targetAudience}

Generate:
1. Primary headline (attention-grabbing)
2. Supporting copy (benefit-focused)
3. Call-to-action (action-oriented)
4. 3-5 relevant hashtags

Format as JSON with keys: headline, copy, cta, hashtags`;

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 400,
        temperature: 0.6,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const generatedText = response.content[0].text.trim();
      
      try {
        const parsedBrief = JSON.parse(generatedText);
        return {
          ...parsedBrief,
          cost: this.calculateCopyCost(response.usage),
          generatedAt: new Date().toISOString()
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          headline: generatedText.split('\n')[0],
          copy: generatedText,
          cta: 'Learn More',
          hashtags: ['#ad', '#product'],
          cost: this.calculateCopyCost(response.usage),
          generatedAt: new Date().toISOString()
        };
      }

    } catch (error) {
      console.error('Creative brief generation error:', error);
      throw error;
    }
  }
}

export default new AnthropicService();
