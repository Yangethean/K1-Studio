import React, { useState, useEffect } from 'react';
import { ListChecks } from 'lucide-react';
import { generateWaveformWorker as generateWaveform, globalWaveformCache } from '../patches/fixes';
import { EMOTIONS } from '../constants';

export interface TimelineClipProps {
  id: number;
  type: 'subtitle' | 'audio';
  startTime: number;
  endTime: number;
  text?: string;
  zoomLevel: number;
  audioUrl?: string;
  waveformPeaks?: number[];
  audioTrimStart?: number;
  audioTrimEnd?: number;
  audioDuration?: number;
  engine?: string;
  voice?: string;
  isActive: boolean;
  isSelected: boolean;
  isDragging?: boolean;
  onSelect: () => void;
  onAutoTrim?: (id: number) => void;
  onDragStart: (e: React.PointerEvent, id: number, type: any) => void;
  onDragMove: (e: React.PointerEvent) => void;
  onDragEnd: (e: React.PointerEvent) => void;
  isOverlapping?: boolean;
  emotions?: string[];
  laneTopPct?: number;
  laneHeightPct?: number;
}

export const TimelineClip = React.memo(({
  id, type, startTime, endTime, text, zoomLevel, audioUrl, waveformPeaks,
  audioTrimStart, audioTrimEnd, audioDuration, engine, voice,
  isActive, isSelected, isDragging, onSelect, onAutoTrim, onDragStart, onDragMove, onDragEnd, isOverlapping,
  emotions, laneTopPct, laneHeightPct
}: TimelineClipProps) => {
  const [localWaveform, setLocalWaveform] = useState<number[] | undefined>(waveformPeaks);

  // Guard against invalid or crash-inducing values
  const safeStartTime = Number.isFinite(startTime) ? startTime : 0;
  const safeEndTime = Number.isFinite(endTime) ? endTime : safeStartTime + 0.1;
  const duration = Math.max(0.01, safeEndTime - safeStartTime);
  
  const left = safeStartTime * zoomLevel;
  const width = Math.max(2, duration * zoomLevel);

  useEffect(() => {
    // If we have peaks, use them
    if (waveformPeaks && waveformPeaks.length > 0) {
      setLocalWaveform(waveformPeaks);
      if (audioUrl) globalWaveformCache.set(audioUrl, waveformPeaks);
    } 
    // If peaks are missing but we have a URL, check global cache or rebuild
    else if (audioUrl) {
       const cached = globalWaveformCache.get(audioUrl);
       if (cached) {
         setLocalWaveform(cached);
       } else if (!localWaveform || localWaveform.length === 0) {
         console.log(`[Waveform] Rebuilding for clip ${id}...`);
         generateWaveform(audioUrl).then(peaks => {
           if (peaks && peaks.length > 0) {
             setLocalWaveform(peaks);
           }
         });
       }
    }
  }, [waveformPeaks, audioUrl, id]);

  const getClipColor = () => {
    if (type === 'subtitle') {
      if (isActive) return 'bg-amber-400 border-amber-300 text-amber-950 ring-2 ring-amber-400/50';
      if (audioUrl) return 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300';
      return 'bg-slate-800/50 border-slate-700 text-slate-400';
    } else {
      if (isOverlapping) return 'bg-rose-500/30 border-rose-400 ring-rose-500/50';
      if (isActive) return 'bg-purple-900 border-purple-400 ring-1 ring-white/30';

      if (emotions && emotions.length > 0) {
        const config = EMOTIONS.find(e => e.id === emotions[0]);
        if (config) {
          return `${config.bg} border-current ring-1 ring-current/20 ${config.color} ${config.glow}`;
        }
      }

      const colors: Record<string, string> = {
        alloy: 'bg-blue-500/20 border-blue-500/60 text-blue-300',
        echo: 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300',
        fable: 'bg-purple-500/20 border-purple-500/60 text-purple-300',
        nova: 'bg-pink-500/20 border-pink-500/60 text-pink-300',
        shimmer: 'bg-orange-500/20 border-orange-500/60 text-orange-300'
      };
      return (voice && colors[voice]) || 'bg-violet-500/20 border-violet-500/60 text-violet-300';
    }
  };

  const handleResetTrim = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('reset-trim', { detail: { id, type } });
    window.dispatchEvent(event);
  };

  return (
    <div 
      className={`absolute rounded-lg border cursor-grab active:cursor-grabbing transition-all timeline-clip ${getClipColor()} ${isSelected ? 'ring-2 ring-white z-50' : 'z-10'} group overflow-hidden`}
      style={{ 
        left, 
        width,
        ...(laneTopPct !== undefined && laneHeightPct !== undefined
          ? { top: `${laneTopPct + 2}%`, height: `${laneHeightPct - 4}%`, minHeight: '24px' }
          : { top: '10%', height: '80%', minHeight: '28px' }),
        opacity: isDragging ? 0.7 : 1,
        transform: isDragging ? 'scale(1.02)' : 'none',
        filter: isDragging ? 'drop-shadow(0 0 8px rgba(251,191,36,0.4))' : 'drop-shadow(0 0 0px transparent)',
        transition: isDragging ? 'none' : 'all 0.2s ease-out'
      }}
      onPointerDown={(e) => {
        onSelect();
        onDragStart(e, id, type);
      }}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onDoubleClick={handleResetTrim}
    >
      {type === 'subtitle' && (
        <>
          <div className="absolute inset-0 px-3 py-1 flex items-center justify-center overflow-hidden pointer-events-none">
            <span className="text-[11px] font-semibold truncate">{text}</span>
          </div>
          
          {/* Left Trim Handle */}
          <div 
             className="absolute left-0 top-0 bottom-0 w-3 hover:bg-white/30 cursor-ew-resize z-20 group hover:shadow-lg hover:shadow-white/20"
             onPointerDown={(e) => { e.stopPropagation(); onDragStart(e, id, 'trim-text-start'); }}
          >
            <div className="absolute inset-y-2 left-1 w-0.5 bg-white/50 group-hover:bg-white opacity-0 group-hover:opacity-100 transition-all" />
            <div className="absolute inset-y-2 left-[6px] w-0.5 bg-white/50 group-hover:bg-white opacity-0 group-hover:opacity-100 transition-all" />
          </div>
          
          {/* Right Trim Handle */}
          <div 
             className="absolute right-0 top-0 bottom-0 w-3 hover:bg-white/30 cursor-ew-resize z-20 group hover:shadow-lg hover:shadow-white/20"
             onPointerDown={(e) => { e.stopPropagation(); onDragStart(e, id, 'trim-text-end'); }}
          >
            <div className="absolute inset-y-2 right-1 w-0.5 bg-white/50 group-hover:bg-white opacity-0 group-hover:opacity-100 transition-all" />
            <div className="absolute inset-y-2 right-[6px] w-0.5 bg-white/50 group-hover:bg-white opacity-0 group-hover:opacity-100 transition-all" />
          </div>
        </>
      )}

      {type === 'audio' && (
        <>
          {/* Waveform with Gradient */}
          {(localWaveform && localWaveform.length > 0) ? (
            <div 
              className="absolute inset-0 h-full overflow-hidden pointer-events-none"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/5 z-10" />
              <div
                className="absolute h-full"
                style={{
                  left: Number.isFinite(audioTrimStart) ? -(audioTrimStart! * zoomLevel) : 0,
                  width: Number.isFinite(audioDuration) ? (audioDuration! * zoomLevel) : (duration * zoomLevel)
                }}
              >
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${localWaveform.length} 100`}>
                  <defs>
                    <linearGradient id={`waveGradient-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                  <path 
                    d={localWaveform.map((v, i) => `M${i},${50 - v * 45} L${i},${50 + v * 45}`).join(' ')} 
                    stroke={`url(#waveGradient-${id})`}
                    strokeWidth="1.5" 
                  />
                </svg>
              </div>

              {/* Hatched overlay for trimmed regions */}
              {Number.isFinite(audioTrimStart) && audioTrimStart! > 0 && (
                <div
                  className="absolute top-0 bottom-0 opacity-40"
                  style={{
                    left: 0,
                    width: `${audioTrimStart! * zoomLevel}px`,
                    background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 3px)'
                  }}
                />
              )}
              {Number.isFinite(audioTrimEnd) && Number.isFinite(audioDuration) && audioTrimEnd! < audioDuration! && (
                <div
                  className="absolute top-0 bottom-0 opacity-40"
                  style={{
                    right: 0,
                    width: `${(audioDuration! - audioTrimEnd!) * zoomLevel}px`,
                    background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 3px)'
                  }}
                />
              )}
            </div>
          ) : audioUrl ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
              <span className="text-[8px] animate-pulse">Building waveform...</span>
            </div>
          ) : null}

          {/* Duration label inside clip */}
          <div className="absolute inset-0 px-2 py-1 flex items-center justify-between pointer-events-none z-20">
            <span className="text-[9px] font-bold text-white/80 bg-black/40 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">{duration.toFixed(2)}s</span>
            {engine && voice && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-500/50">{engine}</span>
              </div>
            )}
          </div>
          
          {/* Overlap Warning Badge */}
          {isOverlapping && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-rose-500/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-rose-400/50 shadow-lg shadow-rose-500/30 whitespace-nowrap z-30">
              ⚠ Overlap
            </div>
          )}

          {/* Left Trim Handle */}
          <div 
             className="absolute left-0 top-0 bottom-0 w-3 hover:bg-white/20 cursor-ew-resize z-20 group hover:shadow-lg hover:shadow-white/20"
             onPointerDown={(e) => { e.stopPropagation(); onDragStart(e, id, 'trim-audio-start'); }}
          >
            <div className="absolute inset-y-2 left-1 w-0.5 bg-white/50 group-hover:bg-white opacity-0 group-hover:opacity-100 transition-all" />
            <div className="absolute inset-y-2 left-[6px] w-0.5 bg-white/50 group-hover:bg-white opacity-0 group-hover:opacity-100 transition-all" />
          </div>

          {/* Right Trim Handle */}
          <div 
             className="absolute right-0 top-0 bottom-0 w-3 hover:bg-white/20 cursor-ew-resize z-20 group hover:shadow-lg hover:shadow-white/20"
             onPointerDown={(e) => { e.stopPropagation(); onDragStart(e, id, 'trim-audio-end'); }}
          >
            <div className="absolute inset-y-2 right-1 w-0.5 bg-white/50 group-hover:bg-white opacity-0 group-hover:opacity-100 transition-all" />
            <div className="absolute inset-y-2 right-[6px] w-0.5 bg-white/50 group-hover:bg-white opacity-0 group-hover:opacity-100 transition-all" />
          </div>

          {onAutoTrim && (
            <button 
              onClick={(e) => { e.stopPropagation(); onAutoTrim(id); }}
              className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[9px] text-slate-300 hover:text-white hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 flex items-center gap-1 active:scale-95 shadow-lg"
              title="Auto Trim Silence"
            >
              <ListChecks className="w-3 h-3" />
              Auto Trim
            </button>
          )}
        </>
      )}
    </div>
  );
});
