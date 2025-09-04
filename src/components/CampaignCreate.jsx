import React, { useState } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { usePaymentContext } from '../hooks/usePaymentContext';
import ImageUploader from './ImageUploader';
import PlatformSelector from './PlatformSelector';
import PayButton from './PayButton';
import CreativeCard from './CreativeCard';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';

function CampaignCreate({ setActiveView }) {
  const [step, setStep] = useState(1);
  const [productImage, setProductImage] = useState(null);
  const [productDescription, setProductDescription] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram', 'tiktok']);
  const [variationCount, setVariationCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCreatives, setGeneratedCreatives] = useState([]);
  const [paid, setPaid] = useState(false);

  const { createCampaign, addCreatives } = useCampaign();
  const { createSession } = usePaymentContext();

  const cost = variationCount * 0.1; // $0.50 for 5 variations = $0.10 per variation

  const handlePayment = async () => {
    try {
      await createSession();
      setPaid(true);
      setStep(4);
      await generateCreatives();
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    }
  };

  const generateCreatives = async () => {
    setIsGenerating(true);
    
    try {
      // Create campaign
      const campaign = createCampaign({
        productImageURL: productImage,
        productDescription,
        selectedPlatforms
      });

      // Simulate AI generation with realistic delay
      const creatives = [];
      
      for (let i = 0; i < variationCount; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay per creative
        
        const creative = {
          variationId: `var_${Date.now()}_${i}`,
          campaignId: campaign.campaignId,
          platform: selectedPlatforms[i % selectedPlatforms.length],
          adType: i % 2 === 0 ? 'feed' : 'story',
          prompt: `Create engaging ad for ${productDescription} on ${selectedPlatforms[i % selectedPlatforms.length]}`,
          generatedImageUrl: productImage, // In real app, this would be AI-generated
          generatedCopy: generateAdCopy(productDescription, selectedPlatforms[i % selectedPlatforms.length], i),
          postUrl: null,
          performanceData: {
            views: Math.floor(Math.random() * 1000),
            likes: Math.floor(Math.random() * 100),
            shares: Math.floor(Math.random() * 20)
          },
          createdAt: new Date().toISOString()
        };
        
        creatives.push(creative);
        setGeneratedCreatives([...creatives]);
      }
      
      // Add creatives to context
      addCreatives(creatives);
      
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAdCopy = (description, platform, index) => {
    const copies = {
      instagram: [
        `✨ Transform your style with ${description}! 💫 Link in bio #StyleGoals`,
        `🔥 Trending now: ${description} - Get yours before it's gone! 🛍️`,
        `💖 Fall in love with ${description} - Your new favorite! ✨`
      ],
      tiktok: [
        `POV: You found the perfect ${description} 😍 #fyp #trending`,
        `This ${description} is about to be everywhere 🔥 #viral`,
        `Tell me you need this ${description} without telling me 💅 #musthave`
      ],
      facebook: [
        `Discover the ${description} everyone's talking about! Limited time offer.`,
        `Why settle for ordinary? Choose ${description} and stand out!`,
        `Join thousands who love their ${description}. Shop now!`
      ]
    };
    
    const platformCopies = copies[platform] || copies.instagram;
    return platformCopies[index % platformCopies.length];
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setActiveView('dashboard')}
          className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">Create New Campaign</h1>
      </div>

      {/* Progress Steps */}
      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div
              key={stepNumber}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold
                ${step >= stepNumber 
                  ? 'bg-accent text-white' 
                  : 'bg-white/20 text-white/50'
                }`}
            >
              {stepNumber}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-white/70">
          <span>Upload</span>
          <span>Configure</span>
          <span>Payment</span>
          <span>Generate</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="glass-effect rounded-xl p-6">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Upload Product Image</h2>
            <ImageUploader
              onImageSelected={setProductImage}
              selectedImage={productImage}
            />
            <div>
              <label className="block text-white font-medium mb-2">
                Product Description (Optional)
              </label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Describe your product to help AI generate better ads..."
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 
                         text-white placeholder:text-white/50 focus:outline-none 
                         focus:ring-2 focus:ring-accent"
                rows={3}
              />
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!productImage}
              className="w-full bg-accent hover:bg-accent/90 disabled:bg-white/20 
                       disabled:text-white/50 text-white px-6 py-3 rounded-lg 
                       font-semibold transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Configure Campaign</h2>
            
            <PlatformSelector
              selectedPlatforms={selectedPlatforms}
              onPlatformsChange={setSelectedPlatforms}
            />
            
            <div>
              <label className="block text-white font-medium mb-2">
                Number of Variations
              </label>
              <select
                value={variationCount}
                onChange={(e) => setVariationCount(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 
                         text-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value={3}>3 Variations - $0.30</option>
                <option value={5}>5 Variations - $0.50</option>
                <option value={8}>8 Variations - $0.80</option>
              </select>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-3 
                         rounded-lg font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-accent hover:bg-accent/90 text-white px-6 py-3 
                         rounded-lg font-semibold transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Payment</h2>
            
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-white">
                  {variationCount} Ad Variations
                </span>
                <span className="text-white font-semibold">
                  ${cost.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between items-center text-lg font-semibold text-white border-t border-white/10 pt-4">
                <span>Total</span>
                <span>${cost.toFixed(3)}</span>
              </div>
            </div>
            
            <PayButton
              amount={cost}
              onPayment={handlePayment}
              disabled={paid}
            />
            
            <button
              onClick={() => setStep(2)}
              className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-3 
                       rounded-lg font-semibold transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-white">
                {isGenerating ? 'Generating Ad Creatives...' : 'Your Ad Creatives'}
              </h2>
              {isGenerating && <Loader2 className="w-5 h-5 text-accent animate-spin" />}
            </div>
            
            {isGenerating && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-accent animate-pulse" />
                </div>
                <p className="text-white/70">
                  AI is creating {variationCount} unique ad variations...
                </p>
                <p className="text-white/50 text-sm mt-2">
                  Generated: {generatedCreatives.length} / {variationCount}
                </p>
              </div>
            )}
            
            {generatedCreatives.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedCreatives.map((creative) => (
                  <CreativeCard key={creative.variationId} creative={creative} />
                ))}
              </div>
            )}
            
            {!isGenerating && generatedCreatives.length > 0 && (
              <button
                onClick={() => setActiveView('dashboard')}
                className="w-full bg-accent hover:bg-accent/90 text-white px-6 py-3 
                         rounded-lg font-semibold transition-colors"
              >
                View Dashboard
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CampaignCreate;