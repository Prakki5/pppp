
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// Helper functions for audio processing
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const LiveInterface: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const currentOutputTranscriptionRef = useRef('');

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsListening(true);
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              setTranscripts(prev => [...prev, currentOutputTranscriptionRef.current]);
              currentOutputTranscriptionRef.current = '';
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error("Live Error", e),
          onclose: () => setIsConnected(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          systemInstruction: "You are Apex Live, a helpful, extremely high-performance AI. Speak naturally and keep responses concise.",
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
    }
  };

  const stopSession = () => {
    sessionRef.current?.close();
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    setIsConnected(false);
    setIsListening(false);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl glass rounded-[40px] p-12 text-center relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent transition-opacity duration-1000 ${isConnected ? 'opacity-100' : 'opacity-0'}`}></div>
        
        <div className="relative z-10 space-y-12">
          <div className="space-y-4">
            <h2 className="text-5xl font-black italic tracking-tighter">APEX LIVE</h2>
            <p className="text-indigo-400 font-bold tracking-[0.3em] uppercase text-xs">Zero-Latency Multimodal Voice</p>
          </div>

          <div className="flex justify-center items-center gap-8 py-12">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${isConnected ? 'bg-indigo-600 scale-110 shadow-indigo-500/40 ring-4 ring-indigo-400/20' : 'bg-gray-800'}`}>
              {isConnected ? (
                <div className="flex items-end gap-1.5 h-12">
                   {[...Array(5)].map((_, i) => (
                     <div key={i} className={`w-2 bg-white rounded-full animate-pulse`} style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 100}ms` }}></div>
                   ))}
                </div>
              ) : (
                <span className="text-4xl">🎙️</span>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <button
              onClick={isConnected ? stopSession : startSession}
              className={`px-12 py-5 rounded-full font-bold text-lg transition-all active:scale-95 shadow-2xl ${
                isConnected 
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' 
                  : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              {isConnected ? 'DISCONNECT' : 'INITIALIZE LIVE LINK'}
            </button>

            <div className="h-40 overflow-y-auto px-6 text-left space-y-3 opacity-80 mask-gradient">
              {transcripts.length === 0 && (
                <p className="text-gray-500 text-center italic mt-16 text-sm">Real-time transcription will appear here...</p>
              )}
              {transcripts.map((t, i) => (
                <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 animate-fade-in">
                  <span className="text-xs text-indigo-400 font-bold uppercase mb-1 block">Apex</span>
                  <p className="text-sm text-gray-200 leading-relaxed">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveInterface;
