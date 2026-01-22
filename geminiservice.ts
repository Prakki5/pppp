
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { ChatMessage } from "../types";

export class GeminiService {
  private static getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async chat(
    message: string, 
    history: ChatMessage[], 
    mode: 'reasoning' | 'search' | 'maps' = 'reasoning'
  ) {
    const ai = this.getAI();
    const model = mode === 'maps' ? 'gemini-2.5-flash' : 'gemini-3-pro-preview';
    
    const config: any = {
      temperature: 0.7,
    };

    if (mode === 'reasoning') {
      config.thinkingConfig = { thinkingBudget: 16000 };
    } else if (mode === 'search') {
      config.tools = [{ googleSearch: {} }];
    } else if (mode === 'maps') {
      config.tools = [{ googleMaps: {} }];
    }

    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config,
    });

    const groundingUrls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => {
        if (chunk.web) return { uri: chunk.web.uri, title: chunk.web.title };
        if (chunk.maps) return { uri: chunk.maps.uri, title: chunk.maps.title };
        return null;
      })
      .filter(Boolean) || [];

    return {
      text: response.text || "No response received.",
      groundingUrls
    };
  }

  static async generateImage(prompt: string, size: '1K' | '2K' | '4K' = '1K') {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: size
        }
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Image generation failed");
  }

  static async generateVideo(prompt: string) {
    const ai = this.getAI();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  static async speak(text: string) {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("TTS failed");
    return base64Audio;
  }
}
