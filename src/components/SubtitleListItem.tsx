import React from 'react';
import { 
  Link2, Link2Off, Loader2, Play, Square, 
  RotateCw, Download, Plus, Trash2, Music, X 
} from 'lucide-react';
import { Subtitle } from '../lib/workspace-types';
import { EMOTIONS, TTS_VOICES, VOXCPM_VOICES } from '../constants';
import { formatTime } from '../services/TimeService';

export interface SubtitleListItemProps {
  sub: Subtitle;
  isActive: boolean;
  isBatchEditMode: boolean;
  selectedSubtitles: Set<number>;
  previewingId: number | null;
  isGeneratingAll: boolean;
  ttsEngine: string;
  defaultVoxCPMVoice: string;
  referenceAudioFile: File | null;
  referenceAudioBase64: string | null;
  handleToggleLink: (id: number) => void;
  toggleSubtitleSelection: (id: number) => void;
  handlePreviewAudio: (e: React.MouseEvent, sub: Subtitle) => void;
  handleGenerateSingle: (e: React.MouseEvent, sub: Subtitle) => void;
  handleEngineChange: (id: number, engine: string) => void;
  handleVoiceChange: (id: number, voice: string) => void;
  handleSubReferenceAudioUpload: (id: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  playAudioFile: (file: File) => void;
  updateSubtitles: (updater: Subtitle[] | ((prev: Subtitle[]) => Subtitle[]), skipHistory?: boolean) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const SubtitleListItem = React.memo(({ 
  sub, 
  isActive, 
  isBatchEditMode, 
  selectedSubtitles, 
  previewingId,
  isGeneratingAll,
  ttsEngine,
  defaultVoxCPMVoice,
  referenceAudioFile,
  referenceAudioBase64,
  handleToggleLink,
  toggleSubtitleSelection,
  handlePreviewAudio,
  handleGenerateSingle,
  handleEngineChange,
  handleVoiceChange,
  handleSubReferenceAudioUpload,
  playAudioFile,
  updateSubtitles,
  videoRef
}: SubtitleListItemProps) => {
  const handleInsertBefore = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateSubtitles((prev) => {
      const idx = prev.findIndex((s) => s.id === sub.id);
      if (idx === -1) return prev;

      const prevSub = idx > 0 ? prev[idx - 1] : null;
      let startTime = 0;
      let endTime = 1.5;

      if (prevSub) {
        const gap = sub.startTime - prevSub.endTime;
        if (gap >= 1.0) {
          startTime = prevSub.endTime + 0.1;
          endTime = Math.min(startTime + 1.5, sub.startTime - 0.1);
        } else {
          startTime = Math.max(0, sub.startTime - 1.0);
          endTime = sub.startTime;
        }
      } else {
        startTime = Math.max(0, sub.startTime - 2.0);
        endTime = Math.max(startTime + 0.5, sub.startTime - 0.1);
      }

      const nextId = prev.length > 0 ? Math.max(...prev.map((s) => s.id)) + 1 : 1;
      const newSub: Subtitle = {
        id: nextId,
        startTime,
        endTime,
        text: "New subtitle line",
        cleanText: "New subtitle line",
        speakerId: sub.speakerId || "Default Speaker",
        voice: "default",
        audioStartTime: startTime,
        isLinked: true,
      };

      const updated = [...prev];
      updated.splice(idx, 0, newSub);
      return updated;
    });
  };

  const handleInsertAfter = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateSubtitles((prev) => {
      const idx = prev.findIndex((s) => s.id === sub.id);
      if (idx === -1) return prev;

      const nextSub = idx < prev.length - 1 ? prev[idx + 1] : null;
      let startTime = sub.endTime + 0.1;
      let endTime = startTime + 1.5;

      if (nextSub) {
        const gap = nextSub.startTime - sub.endTime;
        if (gap >= 1.0) {
          startTime = sub.endTime + 0.1;
          endTime = Math.min(startTime + 1.5, nextSub.startTime - 0.1);
        } else {
          startTime = sub.endTime;
          endTime = sub.endTime + 1.0;
        }
      }

      const nextId = prev.length > 0 ? Math.max(...prev.map((s) => s.id)) + 1 : 1;
      const newSub: Subtitle = {
        id: nextId,
        startTime,
        endTime,
        text: "New subtitle line",
        cleanText: "New subtitle line",
        speakerId: sub.speakerId || "Default Speaker",
        voice: "default",
        audioStartTime: startTime,
        isLinked: true,
      };

      const updated = [...prev];
      updated.splice(idx + 1, 0, newSub);
      return updated;
    });
  };

  const handleDeleteSub = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateSubtitles((prev) => prev.filter((s) => s.id !== sub.id));
  };

  return (
    <div 
      className={`p-3 border-b border-slate-800/50 transition-colors cursor-pointer ${isActive && !isBatchEditMode ? 'bg-slate-800/30 border-l-2 border-l-amber-500' : 'hover:bg-slate-800/20'} ${selectedSubtitles.has(sub.id) ? 'bg-amber-900/20 border-l-2 border-l-amber-500' : ''}`}
      onClick={() => {
        if (isBatchEditMode) {
          toggleSubtitleSelection(sub.id);
        } else {
          if (videoRef.current) {
            videoRef.current.currentTime = sub.startTime;
          }
        }
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); handleToggleLink(sub.id); }}
            className={`p-1 rounded transition ${sub.isLinked === false ? 'bg-rose-500/10 text-rose-500' : 'text-slate-500 hover:text-slate-300'}`}
            title={sub.isLinked === false ? "Unlinked" : "Linked"}
          >
            {sub.isLinked === false ? <Link2Off className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
          </button>
          {isBatchEditMode && (
            <input 
              type="checkbox" 
              checked={selectedSubtitles.has(sub.id)}
              readOnly
              className="w-3 h-3 rounded border-slate-700 bg-slate-900 checked:bg-amber-500"
            />
          )}
          <span className={`text-[10px] ${isActive && !isBatchEditMode ? 'text-amber-500' : 'text-slate-500'}`}>
            {formatTime(sub.startTime)}
            {sub.speakerId && (
              <span className="ml-2 px-1.5 py-0.5 rounded-sm bg-slate-800 text-[9px] uppercase font-bold border border-slate-700 max-w-[80px] truncate inline-block align-middle" title={sub.speakerId}>
                {sub.speakerId}
              </span>
            )}
          </span>
          
          {/* Emotion Badges */}
          <div className="flex items-center gap-1">
            {sub.emotionStatus === 'detecting' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 flex items-center gap-1 animate-pulse border border-amber-500/20">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                AI
              </span>
            )}
            {sub.emotionStatus === 'failed' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20" title="AI detection failed">
                ERROR
              </span>
            )}
            {sub.emotionStatus === 'fallback' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20" title="Using local logic fallback">
                AUTO
              </span>
            )}
            {sub.emotions?.map(eid => {
              const config = EMOTIONS.find(e => e.id === eid);
              if (!config) return null;
              return (
                <span 
                  key={eid} 
                  className={`text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1 font-bold border border-current/20 ${config.bg} ${config.color}`}
                  title={config.label}
                >
                  <span className="text-[10px] leading-none">{config.icon}</span>
                  <span className="uppercase tracking-tighter">{eid}</span>
                </span>
              );
            })}
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          {sub.audioUrl && sub.audioDuration && (sub.audioDuration > sub.endTime - sub.startTime + 0.1) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const containerDuration = sub.endTime - sub.startTime;
                if (containerDuration > 0) {
                  const targetSpeed = Math.min(2.5, Math.max(0.5, sub.audioDuration / containerDuration));
                  updateSubtitles(prev => prev.map(item => item.id === sub.id ? { ...item, speedMultiplier: targetSpeed } : item));
                }
              }}
              className="text-[9px] text-amber-500 font-bold bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/20 active:scale-95 transition-all flex items-center gap-0.5 cursor-pointer select-none"
              title="Speech is longer than subtitle window. Click to automatically speed-up speech to fit exact timing!"
            >
              ⚡ Auto-Fit
            </button>
          )}
          {sub.isGenerating ? (
            <span className="text-[10px] text-amber-500 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin"/>
            </span>
          ) : sub.audioUrl ? (
             <div className="flex items-center gap-2">
              {isActive && <span className="text-[10px] text-emerald-400">Playing</span>}
              <button 
                onClick={(e) => handlePreviewAudio(e, sub)}
                className="text-amber-500 hover:text-amber-400 transition-colors p-1 hover:bg-slate-800 rounded"
                title="Preview Audio"
              >
                {previewingId === sub.id ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>
              <button 
                onClick={(e) => handleGenerateSingle(e, sub)}
                disabled={isGeneratingAll}
                className="text-slate-500 hover:text-amber-400 transition-colors p-1 hover:bg-slate-800 rounded disabled:opacity-50"
                title="Regenerate Audio"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <a href={sub.audioUrl} download={`sub_${sub.id}.wav`} className="text-slate-500 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded" title="Download WAV" onClick={(e) => e.stopPropagation()}>
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <button
                onClick={(e) => handleGenerateSingle(e, sub)}
                disabled={isGeneratingAll}
                className="text-[10px] text-slate-400 hover:text-amber-500 transition-colors px-2 py-1 border border-slate-700 hover:border-amber-500/50 rounded bg-slate-800 disabled:opacity-50"
            >
                Generate
            </button>
          )}

          <div className="h-4 w-[1px] bg-slate-800/80 mx-1" />

          <button
            onClick={handleInsertBefore}
            className="text-slate-500 hover:text-amber-500 hover:bg-slate-800/80 p-1 rounded transition-colors flex items-center justify-center gap-0.5"
            title="Insert Subtitle Line Before"
          >
            <Plus className="w-3 h-3 shrink-0" />
            <span className="text-[8px] font-bold leading-none">▲</span>
          </button>

          <button
            onClick={handleInsertAfter}
            className="text-slate-500 hover:text-amber-500 hover:bg-slate-800/80 p-1 rounded transition-colors flex items-center justify-center gap-0.5"
            title="Insert Subtitle Line After"
          >
            <Plus className="w-3 h-3 shrink-0" />
            <span className="text-[8px] font-bold leading-none">▼</span>
          </button>

          <button
            onClick={handleDeleteSub}
            className="text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 p-1 rounded transition-colors flex items-center justify-center"
            title="Delete Subtitle Line"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>
      <textarea 
        value={sub.text}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
           updateSubtitles(prev => prev.map(s => s.id === sub.id ? { ...s, text: e.target.value } : s));
        }}
        className={`w-full bg-slate-900/50 border border-slate-700/50 rounded-md p-2 text-sm leading-relaxed mb-2 focus:outline-none focus:border-amber-500/50 focus:bg-slate-900 resize-y min-h-[60px] custom-scrollbar transition-colors ${isActive ? 'text-slate-200 font-medium' : 'text-slate-400 focus:text-slate-200'}`}
        placeholder="Subtitle text..."
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar scrollbar-hide no-scrollbar max-w-[140px]">
           {EMOTIONS.map(emo => (
             <button
               key={emo.id}
               onClick={(e) => {
                 e.stopPropagation();
                 const current = sub.emotions || [];
                 const next = current.includes(emo.id) 
                   ? current.filter(id => id !== emo.id)
                   : [...current, emo.id];
                 updateSubtitles(prev => prev.map(s => s.id === sub.id ? { ...s, emotions: next } : s));
               }}
               className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full border transition-all ${sub.emotions?.includes(emo.id) ? `${emo.bg} ${emo.border} ${emo.glow}` : 'border-slate-800 bg-slate-950/50 grayscale opacity-50 hover:grayscale-0 hover:opacity-100'}`}
               title={emo.label}
             >
               <span className="text-xs">{emo.icon}</span>
             </button>
           ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sub.engine || 'voxcpm'}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => handleEngineChange(sub.id, e.target.value)}
            className="bg-slate-900 text-[10px] text-slate-400 border border-slate-700 rounded px-2 py-1 outline-none hover:border-slate-500/50 transition-colors"
          >
            <option value="voxcpm">VoxCPM</option>
            <option value="gemini">Gemini</option>
            <option value="google-free">Google Free</option>
          </select>
          {(() => {
            const eng = (!sub.engine) ? 'voxcpm' : sub.engine;
            return eng === 'gemini' ? (
              <select 
                value={sub.voice} 
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleVoiceChange(sub.id, e.target.value)}
                className="bg-slate-900 text-[10px] text-slate-400 border border-slate-700 rounded px-2 py-1 outline-none hover:border-amber-500/50 transition-colors"
              >
                <option value="default">Global Default</option>
                {TTS_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
            ) : eng === 'voxcpm' ? (
              <div className="flex items-center gap-2">
                <label className={`text-[10px] text-purple-400 border border-slate-700 rounded px-2 py-1 ${!sub.refAudioFile ? 'hover:border-purple-500 cursor-pointer' : ''} bg-slate-900 transition-colors flex items-center gap-1 min-h-[26px]`}>
                   <Music className="w-3 h-3 shrink-0" />
                   {sub.refAudioFile ? (
                     <div className="flex items-center gap-1.5 overflow-hidden">
                       <span className="truncate max-w-[50px] inline-block" title={sub.refAudioFile.name}>{sub.refAudioFile.name}</span>
                       <button 
                          className="hover:text-slate-200 text-slate-400 transition-colors ml-1 p-0.5 rounded hover:bg-slate-700" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            playAudioFile(sub.refAudioFile as File); 
                          }}
                          title="Play Subtitle Ref Audio"
                       >
                         <Play className="w-3 h-3 fill-current" />
                       </button>
                       <button 
                          className="hover:text-red-400 text-slate-400 transition-colors p-0.5 rounded hover:bg-red-500/20" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            updateSubtitles(prev => prev.map(s => s.id === sub.id ? { ...s, refAudioFile: undefined, refAudioBase64: undefined } : s)); 
                          }}
                          title="Remove Subtitle Ref Audio"
                       >
                         <X className="w-3 h-3" />
                       </button>
                     </div>
                   ) : (
                     <span>Add Ref</span>
                   )}
                   {!sub.refAudioFile && <input type="file" accept="audio/*" onClick={(e) => e.stopPropagation()} onChange={(e) => handleSubReferenceAudioUpload(sub.id, e)} className="hidden" />}
                </label>
                <select
                  value={sub.voice === 'default' ? '' : sub.voice}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleVoiceChange(sub.id, e.target.value || 'default')}
                  className="w-32 bg-slate-900 text-[10px] text-purple-400/80 border border-slate-700 rounded px-2 py-1 outline-none hover:border-purple-500/50 transition-colors"
                  title={(sub.refAudioFile || referenceAudioFile) ? "Ref Text (Auto if empty)" : `Prompt Text (Default: ${defaultVoxCPMVoice})`}
                >
                  <option value="">Global Default</option>
                  {VOXCPM_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-[10px] text-slate-600 italic">Default Voice</span>
            );
          })()}
        </div>
      </div>

      {sub.audioUrl && (
        <div className="flex items-center gap-2.5 bg-slate-950/40 border border-slate-800/40 rounded-lg py-1.5 px-2.5 mt-2.5 flex-wrap sm:flex-nowrap">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider select-none shrink-0">Speech Speed:</span>
          <input 
            type="range"
            min="0.5"
            max="2.5"
            step="0.05"
            value={sub.speedMultiplier || 1.0}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              updateSubtitles(prev => prev.map(item => item.id === sub.id ? { ...item, speedMultiplier: val } : item));
            }}
            className="flex-1 h-1 accent-amber-500 rounded bg-slate-800 cursor-pointer min-w-[60px]"
            title="Manually stretch speaking rate for this line"
          />
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[10px] font-mono font-bold text-amber-500/95 w-11 shrink-0 text-right">
              {(sub.speedMultiplier || 1.0).toFixed(2)}x
            </span>
            {sub.speedMultiplier && sub.speedMultiplier !== 1.0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateSubtitles(prev => prev.map(item => item.id === sub.id ? { ...item, speedMultiplier: undefined } : item));
                }}
                className="text-[9px] text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-750 px-1.5 py-0.5 rounded border border-slate-700/60 active:scale-95 transition-all cursor-pointer select-none font-bold uppercase"
                title="Reset local speech speed to 1.0x"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
