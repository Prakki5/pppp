
import React, { useState } from 'react';
import { GeminiService } from '../services/geminiService';

const CreativeStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultType, setResultType] = useState<'image' | 'video'>('image');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('');

  const messages = [
    "Sculpting pixels...",
    "Rendering cinematic frames...",
    "Applying atmospheric lighting...",
    "Ensuring 4K fidelity...",
    "Finalizing masterpiece..."
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    // Check for API Key first
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
      // Assume success and proceed per instructions
    }

    setIsGenerating(true);
    setResultUrl(null);
    let msgIndex = 0;
    const interval = setInterval(() => {
      setLoadingMsg(messages[msgIndex % messages.length]);
      msgIndex++;
    }, 3000);

    try {
      if (resultType === 'image') {
        const url = await GeminiService.generateImage(prompt, '1K');
        setResultUrl(url);
      } else {
        const url = await GeminiService.generateVideo(prompt);
        setResultUrl(url);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
      }
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
      setLoadingMsg('');
    }
  };

  return (
    <div className="h-full p-4 md:p-8 max-w-6xl mx-auto w-full">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-extrabold tracking-tight mb-2">Creative Studio</h2>
        <p className="text-gray-400">Cinematic Vision powered by Veo & Gemini 3 Pro</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="glass p-6 rounded-3xl space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-3 tracking-widest">Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setResultType('image')}
                  className={`flex-1 py-3 rounded-2xl text-sm font-semibold border transition-all ${
                    resultType === 'image' ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-600/20' : 'border-gray-800 hover:bg-white/5 text-gray-400'
                  }`}
                >
                  Statue Image
                </button>
                <button
                  onClick={() => setResultType('video')}
                  className={`flex-1 py-3 rounded-2xl text-sm font-semibold border transition-all ${
                    resultType === 'video' ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-600/20' : 'border-gray-800 hover:bg-white/5 text-gray-400'
                  }`}
                >
                  Veo Video
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-3 tracking-widest">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your vision in detail..."
                className="w-full bg-black/50 border border-gray-800 rounded-2xl p-4 focus:outline-none focus:border-indigo-500 h-32 text-sm leading-relaxed"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl active:scale-[0.98]"
            >
              {isGenerating ? 'GENERATING...' : `GENERATE ${resultType.toUpperCase()}`}
            </button>
            <p className="text-[10px] text-gray-500 text-center leading-relaxed">
              * Note: High-quality generation requires a paid API Key. 
              <br />
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-indigo-400 underline">Billing Docs</a>
            </p>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="aspect-square lg:aspect-video glass rounded-3xl overflow-hidden relative flex items-center justify-center border-2 border-dashed border-gray-800">
            {isGenerating ? (
              <div className="text-center space-y-6">
                <div className="inline-block w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="space-y-1">
                  <p className="text-xl font-bold animate-pulse text-indigo-400">{loadingMsg}</p>
                  <p className="text-sm text-gray-500">This may take a few minutes for videos</p>
                </div>
              </div>
            ) : resultUrl ? (
              resultType === 'image' ? (
                <img src={resultUrl} alt="Generated" className="w-full h-full object-contain" />
              ) : (
                <video src={resultUrl} controls autoPlay loop className="w-full h-full object-contain" />
              )
            ) : (
              <div className="text-center p-12 space-y-4 opacity-30">
                <span className="text-6xl block">✨</span>
                <p className="text-lg font-medium">Your creation will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreativeStudio;
