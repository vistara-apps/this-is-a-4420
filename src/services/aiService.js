import openaiService from './openaiService.js';
import anthropicService from './anthropicService.js';
import { creativeApi } from './api.js';

/**
 * Main AI Service that orchestrates image and copy generation
 * Combines OpenAI DALL-E 3 and Anthropic Claude for complete ad creative generation
 */

export class AIService {
  constructor() {
    this.openai = openaiService;
    this.anthropic = anthropicService;
  }

  /**
   * Generate complete ad creative (image + copy)
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} Complete creative with image and copy
   */
  async generateAdCreative({
    campaignId,
    productDescription,
    platform = 'instagram',
    adType = 'feed',
    style = 'modern',
    tone = 'engaging',
    targetAudience = 'general',
    originalImageUrl = null
  }) {
    try {
      console.log(`Generating creative for ${platform} ${adType}...`);

      // Create initial creative record with generating status
      const creative = await creativeApi.createCreative({
        campaign_id: campaignId,
        platform,
        ad_type: adType,
        prompt: `Generate ${platform} ${adType} ad for: ${productDescription}`,
        status: 'generating',
        generation_cost: 0
      });

      let totalCost = 0;
      let imageUrl = originalImageUrl;
      let generatedCopy = '';
      let errors = [];

      try {
        // Generate image first (if needed)
        if (!originalImageUrl || Math.random() > 0.5) { // 50% chance to generate new image
          console.log('Generating new image...');
          const imageResult = await this.openai.generateAdImage({
            productDescription,
            platform,
            adType,
            style,
            originalImageUrl
          });
          
          imageUrl = imageResult.url;
          totalCost += imageResult.cost;
          console.log(`Image generated. Cost: $${imageResult.cost}`);
        }

        // Generate copy
        console.log('Generating ad copy...');
        const copyResult = await this.anthropic.generateAdCopy({
          productDescription,
          platform,
          adType,
          tone,
          targetAudience
        });
        
        generatedCopy = copyResult.copy;
        totalCost += copyResult.cost;
        console.log(`Copy generated. Cost: $${copyResult.cost}`);

        // Update creative with generated content
        const updatedCreative = await creativeApi.updateCreative(creative.variation_id, {
          generated_image_url: imageUrl,
          generated_copy: generatedCopy,
          status: 'generated',
          generation_cost: totalCost,
          performance_data: {
            views: Math.floor(Math.random() * 100), // Mock initial data
            likes: Math.floor(Math.random() * 20),
            shares: Math.floor(Math.random() * 5),
            comments: Math.floor(Math.random() * 10),
            clicks: 0,
            engagement_rate: 0.0,
            last_updated: new Date().toISOString()
          }
        });

        return {
          ...updatedCreative,
          totalCost,
          errors: errors.length > 0 ? errors : null
        };

      } catch (generationError) {
        console.error('Generation failed:', generationError);
        
        // Update creative with failed status
        await creativeApi.updateCreative(creative.variation_id, {
          status: 'failed',
          generated_copy: `Generation failed: ${generationError.message}`
        });

        throw generationError;
      }

    } catch (error) {
      console.error('AI creative generation error:', error);
      throw error;
    }
  }

  /**
   * Generate multiple ad creatives for a campaign
   * @param {Object} params - Generation parameters
   * @returns {Promise<Array>} Array of generated creatives
   */
  async generateCampaignCreatives({
    campaignId,
    productDescription,
    selectedPlatforms = ['instagram'],
    variationCount = 5,
    style = 'modern',
    tone = 'engaging',
    targetAudience = 'general',
    originalImageUrl = null
  }) {
    const creatives = [];
    const errors = [];
    let totalCost = 0;

    console.log(`Generating ${variationCount} creatives for campaign ${campaignId}...`);

    for (let i = 0; i < variationCount; i++) {
      try {
        const platform = selectedPlatforms[i % selectedPlatforms.length];
        const adTypes = ['feed', 'story'];
        const adType = adTypes[i % adTypes.length];
        
        // Vary styles and tones for diversity
        const styles = ['modern', 'vibrant', 'elegant', 'playful'];
        const tones = ['engaging', 'casual', 'professional', 'playful'];
        const variationStyle = styles[i % styles.length];
        const variationTone = tones[i % tones.length];

        console.log(`Generating creative ${i + 1}/${variationCount}: ${platform} ${adType}`);

        const creative = await this.generateAdCreative({
          campaignId,
          productDescription,
          platform,
          adType,
          style: variationStyle,
          tone: variationTone,
          targetAudience,
          originalImageUrl
        });

        creatives.push(creative);
        totalCost += creative.totalCost || 0;

        // Add delay between generations to respect rate limits
        if (i < variationCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`Creative ${i + 1} generation failed:`, error);
        errors.push({
          index: i,
          platform: selectedPlatforms[i % selectedPlatforms.length],
          error: error.message
        });
      }
    }

    return {
      creatives,
      errors,
      totalCost,
      successCount: creatives.length,
      failureCount: errors.length
    };
  }

  /**
   * Regenerate a specific creative
   * @param {string} variationId - ID of the creative to regenerate
   * @param {Object} options - Regeneration options
   * @returns {Promise<Object>} Regenerated creative
   */
  async regenerateCreative(variationId, options = {}) {
    try {
      // Get existing creative
      const existingCreative = await creativeApi.getCreatives();
      const creative = existingCreative.find(c => c.variation_id === variationId);
      
      if (!creative) {
        throw new Error('Creative not found');
      }

      // Update status to regenerating
      await creativeApi.updateCreative(variationId, {
        status: 'generating'
      });

      const {
        regenerateImage = true,
        regenerateCopy = true,
        style = 'modern',
        tone = 'engaging'
      } = options;

      let totalCost = 0;
      let imageUrl = creative.generated_image_url;
      let generatedCopy = creative.generated_copy;

      // Regenerate image if requested
      if (regenerateImage) {
        const imageResult = await this.openai.generateAdImage({
          productDescription: creative.ad_campaigns?.product_description || 'Product',
          platform: creative.platform,
          adType: creative.ad_type,
          style,
          originalImageUrl: creative.generated_image_url
        });
        
        imageUrl = imageResult.url;
        totalCost += imageResult.cost;
      }

      // Regenerate copy if requested
      if (regenerateCopy) {
        const copyResult = await this.anthropic.generateAdCopy({
          productDescription: creative.ad_campaigns?.product_description || 'Product',
          platform: creative.platform,
          adType: creative.ad_type,
          tone
        });
        
        generatedCopy = copyResult.copy;
        totalCost += copyResult.cost;
      }

      // Update creative with regenerated content
      const updatedCreative = await creativeApi.updateCreative(variationId, {
        generated_image_url: imageUrl,
        generated_copy: generatedCopy,
        status: 'generated',
        generation_cost: (creative.generation_cost || 0) + totalCost
      });

      return {
        ...updatedCreative,
        regenerationCost: totalCost
      };

    } catch (error) {
      console.error('Creative regeneration error:', error);
      
      // Update status to failed
      await creativeApi.updateCreative(variationId, {
        status: 'failed'
      });
      
      throw error;
    }
  }

  /**
   * Get AI service status and capabilities
   * @returns {Object} Service status
   */
  getServiceStatus() {
    return {
      openai: {
        available: !!import.meta.env.VITE_OPENAI_API_KEY,
        service: 'DALL-E 3',
        capabilities: ['image_generation', 'image_variations']
      },
      anthropic: {
        available: !!import.meta.env.VITE_ANTHROPIC_API_KEY,
        service: 'Claude 3 Haiku',
        capabilities: ['copy_generation', 'creative_briefs']
      },
      combined: {
        available: !!(import.meta.env.VITE_OPENAI_API_KEY && import.meta.env.VITE_ANTHROPIC_API_KEY),
        capabilities: ['full_creative_generation', 'campaign_generation']
      }
    };
  }

  /**
   * Estimate cost for creative generation
   * @param {Object} params - Generation parameters
   * @returns {Object} Cost estimate
   */
  estimateGenerationCost({
    variationCount = 1,
    includeImages = true,
    includeCopy = true,
    imageQuality = 'hd'
  }) {
    let totalCost = 0;

    if (includeImages) {
      const imageCost = imageQuality === 'hd' ? 0.080 : 0.040;
      totalCost += imageCost * variationCount;
    }

    if (includeCopy) {
      const copyCost = 0.001; // Approximate cost per copy generation
      totalCost += copyCost * variationCount;
    }

    return {
      totalCost,
      breakdown: {
        images: includeImages ? (imageQuality === 'hd' ? 0.080 : 0.040) * variationCount : 0,
        copy: includeCopy ? 0.001 * variationCount : 0
      },
      variationCount
    };
  }

  /**
   * Validate generation parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result
   */
  validateGenerationParams(params) {
    const errors = [];
    const warnings = [];

    if (!params.productDescription || params.productDescription.trim().length < 10) {
      errors.push('Product description must be at least 10 characters long');
    }

    if (params.productDescription && params.productDescription.length > 500) {
      warnings.push('Long product descriptions may result in less focused creatives');
    }

    if (!params.selectedPlatforms || params.selectedPlatforms.length === 0) {
      errors.push('At least one platform must be selected');
    }

    if (params.variationCount && (params.variationCount < 1 || params.variationCount > 10)) {
      errors.push('Variation count must be between 1 and 10');
    }

    const serviceStatus = this.getServiceStatus();
    if (!serviceStatus.combined.available) {
      errors.push('AI services not properly configured. Please check API keys.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default new AIService();
