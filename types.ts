
export type Capability = 'brain' | 'studio' | 'voice' | 'settings';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  groundingUrls?: Array<{ uri: string; title: string }>;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

// Fix: Define AIStudio interface to match the environment's expected type for window.aistudio.
export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    // Fix: Use the AIStudio interface to resolve type mismatch and modifier errors on the aistudio property.
    aistudio: AIStudio;
    webkitAudioContext: typeof AudioContext;
  }
}
