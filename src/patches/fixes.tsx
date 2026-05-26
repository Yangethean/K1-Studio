// ============================================================
// PATCH FILE: src/patches/fixes.ts
// Three self-contained fixes to drop into App.tsx / your codebase
// ============================================================

// ──────────────────────────────────────────────────────────────
// FIX 1: WAV EXPORT — no sound when dub clips are stacked
// ──────────────────────────────────────────────────────────────
//
// ROOT CAUSE: audioClips uses `audioUrl` for fetch(), but after
// dragging/stacking, the object-URL may be revoked OR the clip's
// `audioBlob` was never attached back. We now prefer `audioBlob`
// first (always in memory) and fall back to fetch(audioUrl).
// We also fix the OfflineAudioContext length calculation that
// sometimes results in a 0-length buffer → silent WAV.
//
// REPLACE your handleExportDubbedWav with this version:

export async function handleExportDubbedWAV_FIXED(
  audioClips: any[],
  dubVolume: number,
  encodeWAV: (samples: Int16Array, sampleRate: number) => Blob,
  setIsExportingAudio: (v: boolean) => void,
  setExportStatus: (v: string | null) => void,
  setErrorMsg: (v: string | null) => void
) {
  if (audioClips.length === 0) {
    setErrorMsg('No generated audio clips to export.');
    return;
  }

  setIsExportingAudio(true);
  setExportStatus('Preparing export...');
  setErrorMsg(null);

  try {
    // ── Step 1: Decode every clip's audio into an AudioBuffer ──
    const SAMPLE_RATE = 24000; // matches Gemini TTS output
    const decoded: { startTime: number; trimStart: number; trimEnd: number; buffer: AudioBuffer }[] = [];

    let maxEndTime = 0;
    for (const clip of audioClips) {
      const clipEnd = clip.endTime ?? (clip.startTime + (clip.audioDuration ?? 0));
      if (clipEnd > maxEndTime) maxEndTime = clipEnd;
    }

    if (maxEndTime <= 0) throw new Error('All clips have zero duration.');

    // Use a REAL AudioContext just for decoding (OfflineAudioContext can't decode in some browsers)
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const decoderCtx = new AudioContextClass({ sampleRate: SAMPLE_RATE });

    let decodedCount = 0;
    let failedCount = 0;

    for (const clip of audioClips) {
      try {
        let arrayBuffer: ArrayBuffer | null = null;

        // Prefer in-memory blob (always valid, even after URL revoke)
        if (clip.audioBlob instanceof Blob) {
          arrayBuffer = await clip.audioBlob.arrayBuffer();
        } else if (clip.audioUrl) {
          const resp = await fetch(clip.audioUrl);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          arrayBuffer = await resp.arrayBuffer();
        }

        if (!arrayBuffer) {
          console.warn(`Clip ${clip.id}: no audio data, skipping.`);
          failedCount++;
          continue;
        }

        // decodeAudioData needs a copy — it detaches the buffer
        const buffer = await decoderCtx.decodeAudioData(arrayBuffer.slice(0));
        decoded.push({
          startTime: clip.startTime ?? 0,
          trimStart: clip.audioTrimStart ?? 0,
          trimEnd: clip.audioTrimEnd ?? buffer.duration,
          buffer,
        });
        decodedCount++;
      } catch (err) {
        console.warn(`Clip ${clip.id} decode failed:`, err);
        failedCount++;
      }
    }

    await decoderCtx.close();

    if (decodedCount === 0) {
      throw new Error(`No valid clips. (Total: ${audioClips.length}, Failed: ${failedCount})`);
    }

    setExportStatus(`Mixing ${decodedCount} clips into WAV...`);

    // ── Step 2: Mix into an OfflineAudioContext ──
    // Add 0.5s padding so the last clip doesn't get cut
    const totalSamples = Math.ceil((maxEndTime + 0.5) * SAMPLE_RATE);
    const offlineCtx = new OfflineAudioContext(1, totalSamples, SAMPLE_RATE);

    for (const { startTime, trimStart, trimEnd, buffer } of decoded) {
      // Re-create a buffer in the offline context's sample rate
      const resampledDuration = trimEnd - trimStart;
      if (resampledDuration <= 0) continue;

      const source = offlineCtx.createBufferSource();

      // If sample rates differ, OfflineAudioContext handles resampling automatically
      source.buffer = buffer;

      const gain = offlineCtx.createGain();
      gain.gain.value = Math.max(0, Math.min(2, dubVolume));
      source.connect(gain);
      gain.connect(offlineCtx.destination);

      // source.start(when, offset, duration)
      source.start(
        Math.max(0, startTime),
        trimStart,
        resampledDuration
      );
    }

    const rendered = await offlineCtx.startRendering();

    // ── Step 3: Convert Float32 → Int16 PCM → WAV ──
    const floatData = rendered.getChannelData(0);
    const int16 = new Int16Array(floatData.length);
    for (let i = 0; i < floatData.length; i++) {
      const s = Math.max(-1, Math.min(1, floatData[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    const wavBlob = encodeWAV(int16, rendered.sampleRate);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dubbed-output.wav';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Don't revoke immediately — give browser time to start download
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    setExportStatus('Export complete! 🎉');
    setTimeout(() => setExportStatus(null), 3000);
  } catch (err: any) {
    console.error('WAV export failed:', err);
    setErrorMsg(`Export failed: ${err.message}`);
    setExportStatus(null);
  } finally {
    setIsExportingAudio(false);
  }
}


// ──────────────────────────────────────────────────────────────
// FIX 2: VIRTUAL SCROLL for Subtitle List
// ──────────────────────────────────────────────────────────────
//
// DROP-IN replacement for the subtitle list `<div>` inside App.tsx.
// Renders only what's visible — 800 rows feel as fast as 10.
//
// Usage in App.tsx:
//   Replace the section that maps subtitles with <VirtualSubtitleList />

import React, { useRef, useState, useEffect, useCallback } from 'react';

const ITEM_HEIGHT = 168; // px — approximate height of one SubtitleListItem

interface VirtualSubtitleListProps {
  subtitles: any[];
  renderItem: (sub: any, index: number) => React.ReactNode;
  scrollToActiveId?: number | null;
}

export const VirtualSubtitleList: React.FC<VirtualSubtitleListProps> = ({
  subtitles,
  renderItem,
  scrollToActiveId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // Observe container resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Scroll to active subtitle
  useEffect(() => {
    if (scrollToActiveId == null) return;
    const idx = subtitles.findIndex((s) => s.id === scrollToActiveId);
    if (idx < 0) return;
    const target = idx * ITEM_HEIGHT;
    const el = containerRef.current;
    if (!el) return;
    // Only scroll if out of view
    if (target < el.scrollTop || target + ITEM_HEIGHT > el.scrollTop + el.clientHeight) {
      el.scrollTo({ top: target - el.clientHeight / 2, behavior: 'smooth' });
    }
  }, [scrollToActiveId, subtitles]);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const overscan = 4;
  const totalHeight = subtitles.length * ITEM_HEIGHT;

  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - overscan);
  const endIndex = Math.min(
    subtitles.length - 1,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + overscan
  );

  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push({ sub: subtitles[i], index: i });
  }

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto custom-scrollbar"
      style={{ position: 'relative' }}
    >
      {/* Full height spacer so scrollbar is correct */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ sub, index }) => (
          <div
            key={sub.id}
            style={{
              position: 'absolute',
              top: index * ITEM_HEIGHT,
              left: 0,
              right: 0,
              height: ITEM_HEIGHT,
              overflow: 'hidden',
            }}
          >
            {renderItem(sub, index)}
          </div>
        ))}
      </div>
    </div>
  );
};


// ──────────────────────────────────────────────────────────────
// FIX 3: GPU / Worker waveform generation
// ──────────────────────────────────────────────────────────────
//
// Creates a shared pool of Web Workers so waveform generation
// never blocks the main thread. Falls back gracefully if Workers
// aren't supported.
//
// Usage: replace calls to generateWaveform(url) with
//        generateWaveformWorker(url)

type WaveformJob = {
  resolve: (peaks: number[]) => void;
  reject: (err: any) => void;
};

const workerPool: Worker[] = [];
const jobMap = new Map<string, WaveformJob>();
const waveformCache = new Map<string, number[]>();
let workerIndex = 0;

function getWorkerPool(): Worker[] {
  if (workerPool.length > 0) return workerPool;

  // Use 2 workers — enough parallelism without thrashing
  const count = Math.min(2, navigator.hardwareConcurrency ?? 2);
  for (let i = 0; i < count; i++) {
    try {
      // The worker file must be placed in /public/waveform.worker.js
      const w = new Worker('/waveform.worker.js');
      w.onmessage = (e) => {
        const { id, peaks, error } = e.data;
        const job = jobMap.get(id);
        if (!job) return;
        jobMap.delete(id);
        if (error) {
          console.warn("Waveform worker failed, using safe fallback peaks:", error);
          job.resolve([]);
        } else {
          if (peaks.length > 0) waveformCache.set(id, peaks);
          job.resolve(peaks);
        }
      };
      workerPool.push(w);
    } catch {
      // Workers not available (e.g., certain sandboxed environments)
      break;
    }
  }
  return workerPool;
}

export async function generateWaveformWorker(url: string, samples = 120): Promise<number[]> {
  // Return cached result immediately
  if (waveformCache.has(url)) return waveformCache.get(url)!;

  const pool = getWorkerPool();

  // No worker available → fall back to main-thread (original logic)
  if (pool.length === 0) {
    return generateWaveformMainThread(url, samples);
  }

  return new Promise(async (resolve) => {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const arrayBuffer = await resp.arrayBuffer();

      // Round-robin worker selection
      const worker = pool[workerIndex % pool.length];
      workerIndex++;

      const jobId = url;
      jobMap.set(jobId, { resolve, reject: resolve });

      // Transfer the ArrayBuffer to the worker (zero-copy)
      worker.postMessage({ id: jobId, arrayBuffer, samples }, [arrayBuffer]);
    } catch (err) {
      console.warn("Waveform creation failed, using empty peak fallback:", err);
      resolve([]);
    }
  });
}

async function generateWaveformMainThread(url: string, samples = 120): Promise<number[]> {
  try {
    const resp = await fetch(url);
    const arrayBuffer = await resp.arrayBuffer();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    const buffer = await audioCtx.decodeAudioData(arrayBuffer);
    const data = buffer.getChannelData(0);
    const blockSize = Math.floor(data.length / samples);
    const peaks: number[] = [];
    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        const v = data[i * blockSize + j];
        sum += v * v;
      }
      peaks.push(Math.sqrt(sum / blockSize));
    }
    await audioCtx.close();
    const max = Math.max(...peaks) || 1;
    const norm = peaks.map((p) => Math.pow(p / max, 0.75));
    waveformCache.set(url, norm);
    return norm;
  } catch {
    return [];
  }
}

// Export cache for compatibility with existing globalWaveformCache references
export const globalWaveformCache = waveformCache;

// ──────────────────────────────────────────────────────────────
// MULTI-CHANNEL STEREO MIXER ENGINE
// ──────────────────────────────────────────────────────────────

function encodeStereoWAV(left: Float32Array, right: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + left.length * 4);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + left.length * 4, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count (2 for stereo)
  view.setUint16(22, 2, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 4, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 4, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, left.length * 4, true);

  // Write Interleaved Stereo samples
  let index = 44;
  for (let i = 0; i < left.length; i++) {
    // Left
    const sL = Math.max(-1, Math.min(1, left[i]));
    const sampleL = sL < 0 ? sL * 0x8000 : sL * 0x7fff;
    view.setInt16(index, sampleL, true);
    index += 2;

    // Right
    const sR = Math.max(-1, Math.min(1, right[i]));
    const sampleR = sR < 0 ? sR * 0x8000 : sR * 0x7fff;
    view.setInt16(index, sampleR, true);
    index += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export async function handleExportMasterWAV_MIXED(
  audioClips: any[],
  videoFile: File | null,
  bgMusicUrl: string,
  videoVolume: number,
  dubVolume: number,
  bgMusicVolume: number,
  masterVolume: number,
  videoMute: boolean,
  dubMute: boolean,
  bgMusicMute: boolean,
  masterMute: boolean,
  videoSolo: boolean,
  dubSolo: boolean,
  bgMusicSolo: boolean,
  videoPan: number,
  dubPan: number,
  bgMusicPan: number,
  isDuckingEnabled: boolean,
  duckingFactor: number,
  totalDuration: number,
  ffmpegRef: React.MutableRefObject<any>,
  setIsExportingAudio: (v: boolean) => void,
  setExportStatus: (v: string | null) => void,
  setErrorMsg: (v: string | null) => void,
  fetchFile: any,
  toBlobURL: any,
  FFmpegClass: any,
  exportType: 'audio' | 'video'
) {
  if (totalDuration <= 0) {
    setErrorMsg('Cannot export with zero total timeline duration.');
    return;
  }

  setIsExportingAudio(true);
  setExportStatus('Starting stem analysis...');
  setErrorMsg(null);

  try {
    const SAMPLE_RATE = 24000;

    // 1. Decode Video audio track via FFmpeg
    let originalAudioBuffer: AudioBuffer | null = null;
    let decodedOriginalSuccess = false;

    if (videoFile) {
      setExportStatus('Analyzing original video audio track (FFmpeg)...');
      try {
        if (!ffmpegRef.current) {
          const ffmpeg = new FFmpegClass();
          const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
          await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          });
          ffmpegRef.current = ffmpeg;
        }

        const ffmpeg = ffmpegRef.current;
        const fileExt = videoFile.name.split('.').pop() || 'mp4';
        await ffmpeg.writeFile('input.' + fileExt, await fetchFile(videoFile));

        setExportStatus('Extracting audio track metadata...');
        // Extract to 24000Hz stereo WAV
        await ffmpeg.exec([
          '-i', 'input.' + fileExt,
          '-vn',
          '-ac', '2',
          '-ar', '24000',
          'original_audio.wav'
        ]);

        const audioData = await ffmpeg.readFile('original_audio.wav');
        if (audioData && audioData.byteLength > 0) {
          const decoderCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
          originalAudioBuffer = await decoderCtx.decodeAudioData(audioData.buffer.slice(0));
          decodedOriginalSuccess = true;
          await decoderCtx.close();
        }
      } catch (err) {
        console.warn("Audio extraction omitted or failed (standard if video has no track or CORS limits):", err);
      }
    }

    // 2. Decode BGM
    let bgMusicBuffer: AudioBuffer | null = null;
    if (bgMusicUrl) {
      setExportStatus('Fetching and loading Background Music...');
      try {
        const resp = await fetch(bgMusicUrl);
        if (resp.ok) {
          const arrayBuffer = await resp.arrayBuffer();
          const decoderCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
          bgMusicBuffer = await decoderCtx.decodeAudioData(arrayBuffer);
          await decoderCtx.close();
        }
      } catch (err) {
        console.warn("Could not decode BGM track:", err);
      }
    }

    // 3. Decode TTS audio clips
    setExportStatus(`Decoding voice clips (Total: ${audioClips.length})...`);
    const decodedTTS: { startTime: number; trimStart: number; trimEnd: number; buffer: AudioBuffer }[] = [];
    const decoderCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });

    for (const clip of audioClips) {
      try {
        let arrayBuffer: ArrayBuffer | null = null;
        if (clip.audioBlob instanceof Blob) {
          arrayBuffer = await clip.audioBlob.arrayBuffer();
        } else if (clip.audioUrl) {
          const resp = await fetch(clip.audioUrl);
          if (resp.ok) {
            arrayBuffer = await resp.arrayBuffer();
          }
        }

        if (arrayBuffer) {
          const buffer = await decoderCtx.decodeAudioData(arrayBuffer.slice(0));
          decodedTTS.push({
            startTime: clip.startTime ?? 0,
            trimStart: clip.audioTrimStart ?? 0,
            trimEnd: clip.audioTrimEnd ?? buffer.duration,
            buffer
          });
        }
      } catch (err) {
        console.warn(`Vocal clip ${clip.id} omitted:`, err);
      }
    }
    await decoderCtx.close();

    // 4. Offline Multi-Channel Mix Setup
    setExportStatus('Synthesizing stem outputs in offline mix matrix...');
    const totalSamples = Math.ceil(totalDuration * SAMPLE_RATE);
    const offlineCtx = new OfflineAudioContext(2, totalSamples >= SAMPLE_RATE ? totalSamples : SAMPLE_RATE, SAMPLE_RATE);

    const isAnySoloActive = videoSolo || dubSolo || bgMusicSolo;

    // Connect Track A: Original Video Audio
    const isVideoAudible = !videoMute && (!isAnySoloActive || videoSolo) && !masterMute;
    if (originalAudioBuffer && isVideoAudible) {
      const source = offlineCtx.createBufferSource();
      source.buffer = originalAudioBuffer;

      const gain = offlineCtx.createGain();
      const baseVol = videoVolume * masterVolume;
      gain.gain.setValueAtTime(baseVol, 0);

      // Auto-Ducking
      if (isDuckingEnabled && decodedTTS.length > 0) {
        for (const clip of decodedTTS) {
          const s = clip.startTime;
          const e = s + (clip.trimEnd - clip.trimStart);
          gain.gain.setValueAtTime(baseVol, Math.max(0, s - 0.15));
          gain.gain.linearRampToValueAtTime(baseVol * duckingFactor, s);
          gain.gain.setValueAtTime(baseVol * duckingFactor, e);
          gain.gain.linearRampToValueAtTime(baseVol, Math.min(totalDuration, e + 0.2));
        }
      }

      const panner = offlineCtx.createStereoPanner();
      panner.pan.setValueAtTime(videoPan, 0);

      source.connect(gain);
      gain.connect(panner);
      panner.connect(offlineCtx.destination);
      source.start(0);
    }

    // Connect Track B: Background Music
    const isBgmAudible = bgMusicBuffer && !bgMusicMute && (!isAnySoloActive || bgMusicSolo) && !masterMute;
    if (bgMusicBuffer && isBgmAudible) {
      const source = offlineCtx.createBufferSource();
      source.buffer = bgMusicBuffer;
      source.loop = true;

      const gain = offlineCtx.createGain();
      const baseVol = bgMusicVolume * masterVolume;
      gain.gain.setValueAtTime(baseVol, 0);

      // Auto-Ducking
      if (isDuckingEnabled && decodedTTS.length > 0) {
        for (const clip of decodedTTS) {
          const s = clip.startTime;
          const e = s + (clip.trimEnd - clip.trimStart);
          gain.gain.setValueAtTime(baseVol, Math.max(0, s - 0.15));
          gain.gain.linearRampToValueAtTime(baseVol * duckingFactor, s);
          gain.gain.setValueAtTime(baseVol * duckingFactor, e);
          gain.gain.linearRampToValueAtTime(baseVol, Math.min(totalDuration, e + 0.2));
        }
      }

      const panner = offlineCtx.createStereoPanner();
      panner.pan.setValueAtTime(bgMusicPan, 0);

      source.connect(gain);
      gain.connect(panner);
      panner.connect(offlineCtx.destination);
      source.start(0);
    }

    // Connect Track C: TTS Dub Vocals (multiple channels)
    const isDubAudible = !dubMute && (!isAnySoloActive || dubSolo) && !masterMute;
    if (isDubAudible) {
      for (const { startTime, trimStart, trimEnd, buffer } of decodedTTS) {
        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;

        const gain = offlineCtx.createGain();
        gain.gain.setValueAtTime(dubVolume * masterVolume, 0);

        const panner = offlineCtx.createStereoPanner();
        panner.pan.setValueAtTime(dubPan, 0);

        source.connect(gain);
        gain.connect(panner);
        panner.connect(offlineCtx.destination);

        const dur = trimEnd - trimStart;
        if (dur > 0) {
          source.start(Math.max(0, startTime), trimStart, dur);
        }
      }
    }

    // Render Offline buffer
    setExportStatus('Rendering final master track...');
    const rendered = await offlineCtx.startRendering();

    const left = rendered.getChannelData(0);
    const right = rendered.getChannelData(1);

    const masterWav = encodeStereoWAV(left, right, SAMPLE_RATE);

    if (exportType === 'video' && videoFile) {
      setExportStatus('Composing new audio back into video stream (FFmpeg)...');
      const ffmpeg = ffmpegRef.current;
      const fileExt = videoFile.name.split('.').pop() || 'mp4';
      
      await ffmpeg.writeFile('master_mix.wav', await fetchFile(masterWav));
      
      // Merge audio and video cleanly without re-encoding video streams
      const outputName = videoFile.name.replace(/\.[^/.]+$/, "") + "_dubbed.mp4";
      await ffmpeg.exec([
        '-i', 'input.' + fileExt,
        '-i', 'master_mix.wav',
        '-c:v', 'copy',
        '-map', '0:v',
        '-map', '1:a',
        '-shortest',
        '-y',
        outputName
      ]);

      const finishedBytes = await ffmpeg.readFile(outputName);
      const finishedBlob = new Blob([finishedBytes.buffer], { type: 'video/mp4' });

      const url = URL.createObjectURL(finishedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outputName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 6000);

      setExportStatus('Export complete! 🎉');
      setTimeout(() => setExportStatus(null), 3500);
    } else {
      // Audio export download
      const url = URL.createObjectURL(masterWav);
      const a = document.createElement('a');
      a.href = url;
      a.download = (videoFile ? videoFile.name.replace(/\.[^/.]+$/, "") : "dubbed-project") + "_master.wav";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 6000);

      setExportStatus('Export complete! 🎉');
      setTimeout(() => setExportStatus(null), 3500);
    }
  } catch (err: any) {
    console.error("Master Export Failed:", err);
    setErrorMsg("Master Export failed: " + (err.message ?? String(err)));
    setExportStatus(null);
  } finally {
    setIsExportingAudio(false);
  }
}

