import { generateWaveformWorker as generateWaveform, globalWaveformCache } from '../patches/fixes';

export { generateWaveform, globalWaveformCache };

export function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    const timeout = setTimeout(() => {
      resolve(1.5); // Fallback estimate
    }, 3000); // 3-second safety timeout

    audio.onloadedmetadata = () => {
      clearTimeout(timeout);
      resolve(audio.duration || 1.5);
    };
    audio.onerror = () => {
      clearTimeout(timeout);
      resolve(1.5);
    };
  });
}

export async function autoTrimSilence(url: string, threshold: number = 0.015): Promise<{ start: number; end: number }> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    let firstSample = 0;
    for (let i = 0; i < channelData.length; i++) {
        if (Math.abs(channelData[i]) > threshold) {
            firstSample = i;
            break;
        }
    }
    
    let lastSample = channelData.length - 1;
    for (let i = channelData.length - 1; i >= 0; i--) {
        if (Math.abs(channelData[i]) > threshold) {
            lastSample = i;
            break;
        }
    }
    
    const start = firstSample / sampleRate;
    const end = lastSample / sampleRate;
    
    await audioContext.close();
    return { start, end };
  } catch (e) {
    console.warn('Failed to auto trim silence', e);
    return { start: 0, end: 0 };
  }
}

export function encodeWAV(samples: Int16Array, sampleRate: number = 24000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    view.setInt16(offset, samples[i], true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

export async function normalizeAudioBlob(blob: Blob, targetPeak: number = 0.95): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0); // TTS output is mono
    
    let maxVal = 0;
    for (let i = 0; i < channelData.length; i++) {
      const val = Math.abs(channelData[i]);
      if (val > maxVal) {
        maxVal = val;
      }
    }
    
    if (maxVal < 0.0001) {
      return blob; // Silent audio, skip normalizing
    }
    
    const gain = targetPeak / maxVal;
    const pcm16 = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
      const scaled = channelData[i] * gain;
      const clamped = Math.min(1.0, Math.max(-1.0, scaled));
      pcm16[i] = clamped < 0 ? clamped * 32768 : clamped * 32767;
    }
    
    try {
      if (audioContext.state !== 'closed') {
        await audioContext.close();
      }
    } catch (closeErr) {
      console.warn("Could not close audioContext:", closeErr);
    }
    
    return encodeWAV(pcm16, sampleRate);
  } catch (err) {
    console.error("Failed to automatically normalize audio:", err);
    return blob;
  }
}
