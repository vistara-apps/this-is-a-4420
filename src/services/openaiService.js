import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
});

/**
 * OpenAI Service for Image Generation
 * Uses DALL-E 3 for creating ad creative images
 */

export class OpenAIService {
  constructor() {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      console.warn('OpenAI API key not found. Image generation will use fallback.');
    }
  }

  /**
   * Generate ad creative image using DALL-E 3
   * @param {Object} params - Generation parameters
   * @param {string} params.productDescription - Description of the product
   * @param {string} params.platform - Target platform (instagram, tiktok, etc.)
   * @param {string} params.adType - Type of ad (feed, story, etc.)
   * @param {string} params.style - Visual style preference
   * @returns {Promise<Object>} Generated image data
   */
  async generateAdImage({
    productDescription,
    platform = 'instagram',
    adType = 'feed',
    style = 'modern',
    originalImageUrl = null
  }) {
    try {
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      // Create platform-specific prompt
      const prompt = this.createImagePrompt({
        productDescription,
        platform,
        adType,
        style,
        originalImageUrl
      });

      console.log('Generating image with prompt:', prompt);

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: this.getImageSize(platform, adType),
        quality: "hd",
        style: style === 'natural' ? 'natural' : 'vivid'
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No image generated');
      }

      const imageData = response.data[0];
      
      return {
        url: imageData.url,
        revisedPrompt: imageData.revised_prompt,
        platform,
        adType,
        cost: this.calculateImageCost('dall-e-3', 'hd'),
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('OpenAI image generation error:', error);
      
      if (error.code === 'content_policy_violation') {
        throw new Error('Content policy violation. Please try a different product description.');
      }
      
      if (error.code === 'rate_limit_exceeded') {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI quota exceeded. Please check your billing.');
      }
      
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }

  /**
   * Create optimized prompt for image generation
   */
  createImagePrompt({ productDescription, platform, adType, style, originalImageUrl }) {
    const platformSpecs = {
      instagram: {
        feed: 'Instagram feed post, square format, bright and engaging',
        story: 'Instagram story format, vertical orientation, eye-catching',
        reel: 'Instagram reel thumbnail, dynamic and energetic'
      },
      tiktok: {
        feed: 'TikTok video thumbnail, vertical format, trendy and viral',
        story: 'TikTok story format, bold and attention-grabbing'
      },
      facebook: {
        feed: 'Facebook post image, horizontal format, professional yet engaging',
        story: 'Facebook story format, vertical orientation'
      },
      twitter: {
        feed: 'Twitter post image, horizontal format, clean and impactful'
      },
      linkedin: {
        feed: 'LinkedIn post image, professional and business-focused'
      }
    };

    const styleDescriptors = {
      modern: 'modern, clean, minimalist design',
      vibrant: 'vibrant colors, energetic, bold design',
      elegant: 'elegant, sophisticated, premium feel',
      playful: 'playful, fun, colorful design',
      professional: 'professional, corporate, trustworthy',
      natural: 'natural lighting, realistic, authentic'
    };

    const platformSpec = platformSpecs[platform]?.[adType] || platformSpecs[platform]?.feed || 'social media post';
    const styleDesc = styleDescriptors[style] || styleDescriptors.modern;

    let basePrompt = `Create a ${platformSpec} featuring ${productDescription}. `;
    basePrompt += `Style: ${styleDesc}. `;
    basePrompt += `High quality, professional advertising photography, `;
    basePrompt += `optimized for social media engagement. `;
    
    if (originalImageUrl) {
      basePrompt += `Maintain the essence of the original product while creating a fresh, engaging variation. `;
    }
    
    basePrompt += `No text overlays, clean composition, marketing-ready.`;

    return basePrompt;
  }

  /**
   * Get appropriate image size for platform and ad type
   */
  getImageSize(platform, adType) {
    const sizes = {
      instagram: {
        feed: '1024x1024',
        story: '1024x1792',
        reel: '1024x1792'
      },
      tiktok: {
        feed: '1024x1792',
        story: '1024x1792'
      },
      facebook: {
        feed: '1024x1024',
        story: '1024x1792'
      },
      twitter: {
        feed: '1024x1024'
      },
      linkedin: {
        feed: '1024x1024'
      }
    };

    return sizes[platform]?.[adType] || sizes[platform]?.feed || '1024x1024';
  }

  /**
   * Calculate cost for image generation
   */
  calculateImageCost(model, quality) {
    const costs = {
      'dall-e-3': {
        'standard': 0.040, // $0.040 per image
        'hd': 0.080        // $0.080 per image
      }
    };

    return costs[model]?.[quality] || 0.080;
  }

  /**
   * Generate multiple image variations
   */
  async generateImageVariations({
    productDescription,
    platforms = ['instagram'],
    variationCount = 3,
    style = 'modern'
  }) {
    const variations = [];
    const errors = [];

    for (let i = 0; i < variationCount; i++) {
      const platform = platforms[i % platforms.length];
      const adTypes = ['feed', 'story'];
      const adType = adTypes[i % adTypes.length];

      try {
        const variation = await this.generateAdImage({
          productDescription,
          platform,
          adType,
          style
        });
        
        variations.push({
          ...variation,
          variationIndex: i
        });

        // Add delay to respect rate limits
        if (i < variationCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`Variation ${i} failed:`, error);
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
}

export default new OpenAIService();
