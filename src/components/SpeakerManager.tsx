import React, { useMemo } from 'react';
import { ListChecks, Music, X } from 'lucide-react';
import { EMOTIONS } from '../constants';
import { Speaker, Subtitle } from '../lib/workspace-types';

export interface SpeakerManagerProps {
  speakers: Speaker[];
  updateSpeaker: (id: string, updates: Partial<Speaker>) => void;
  onAutoDetect: () => void;
  applySpeakerToAll: (speaker: Speaker) => void;
  subtitles: Subtitle[];
  ttsEngine: string;
  defaultGeminiVoice: string;
  defaultVoxCPMVoice: string;
}

export const SpeakerManager = ({ 
  speakers, 
  updateSpeaker, 
  onAutoDetect, 
  applySpeakerToAll, 
  subtitles, 
  ttsEngine, 
  defaultGeminiVoice, 
  defaultVoxCPMVoice 
}: SpeakerManagerProps) => {
  // calculate line counts
  const speakerStats = useMemo(() => {
    const stats: Record<string, number> = {};
    subtitles.forEach((s: Subtitle) => {
      const id = s.speakerId || 'Default Speaker';
      stats[id] = (stats[id] || 0) + 1;
    });
    return stats;
  }, [subtitles]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Speakers ({speakers.length})</h3>
        <button 
          onClick={onAutoDetect}
          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-500 px-2 py-1 rounded border border-slate-700 flex items-center gap-1 transition-colors"
        >
          <ListChecks className="w-3 h-3" />
          Auto Detect
        </button>
      </div>

      <div className="space-y-3">
        {speakers.map((speaker: Speaker) => (
          <div key={speaker.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-3 group text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-4 rounded-full" style={{ backgroundColor: speaker.color }} />
                <span className="text-sm font-bold text-slate-100">{speaker.name}</span>
                <span className="text-[10px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                  {speakerStats[speaker.id] || 0} Lines
                </span>
              </div>
              <button
                onClick={() => applySpeakerToAll(speaker)}
                className="text-[9px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded transition-colors uppercase font-bold"
                title="Apply these voice settings to all lines assigned to this speaker"
              >
                Apply to all
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
               <div className="space-y-1">
                 <label className="text-[10px] text-slate-500 uppercase font-bold text-[9px]">Voice & Engine</label>
                 <div className="flex gap-1">
                   <select 
                      value={speaker.engine || 'voxcpm'}
                      onChange={(e) => updateSpeaker(speaker.id, { engine: e.target.value })}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-slate-200 outline-none focus:border-amber-500/50"
                   >
                     <option value="voxcpm">VoxCPM</option>
                     <option value="google-free">Google Free</option>
                     <option value="gemini">Gemini</option>
                   </select>

                   <input 
                      type="text"
                      list={speaker.engine === 'gemini' ? 'gemini-voices' : speaker.engine === 'voxcpm' ? 'voxcpm-voices' : ''}
                      value={speaker.voice}
                      onChange={(e) => updateSpeaker(speaker.id, { voice: e.target.value })}
                      placeholder={speaker.engine === 'google-free' ? 'km' : speaker.engine === 'gemini' ? defaultGeminiVoice : speaker.engine === 'voxcpm' ? defaultVoxCPMVoice : 'Voice ID'}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-slate-200 outline-none focus:border-amber-500/50"
                   />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold text-[9px]">Default Emotion</label>
                    <select
                      value={speaker.defaultEmotion || ''}
                      onChange={(e) => updateSpeaker(speaker.id, { defaultEmotion: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-slate-200 outline-none focus:border-amber-500/50"
                    >
                      <option value="">None</option>
                      {EMOTIONS.map(emo => (
                        <option key={emo.id} value={emo.id}>{emo.icon} {emo.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold text-[9px]">Sensitivity: {(speaker.emotionSensitivity ?? 0.5).toFixed(1)}</label>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={speaker.emotionSensitivity ?? 0.5}
                      onChange={(e) => updateSpeaker(speaker.id, { emotionSensitivity: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 h-4 bg-slate-950 rounded cursor-pointer"
                    />
                  </div>
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] text-slate-500 uppercase font-bold text-[9px]">Reference Audio</label>
                 <div 
                    className="relative border border-dashed border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/30 transition-colors rounded p-2 flex flex-col items-center justify-center group/drop cursor-pointer min-h-[40px]"
                 >
                    {speaker.refAudioFile ? (
                      <div className="flex items-center gap-2 w-full truncate px-1">
                        <Music className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="text-[10px] text-slate-300 truncate font-mono">{speaker.refAudioFile.name}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); updateSpeaker(speaker.id, { refAudioFile: null, refAudioBase64: null }); }}
                          className="ml-auto p-0.5 hover:text-red-400 text-slate-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 group-hover/drop:text-slate-300">Drop Ref Audio</span>
                    )}
                    <input 
                      type="file" 
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                             const base64 = (reader.result as string).split(',')[1];
                             updateSpeaker(speaker.id, { refAudioFile: file, refAudioBase64: base64 });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                 </div>
               </div>
            </div>
          </div>
        ))}

        {speakers.length === 0 && (
          <div className="text-center py-12 px-4 bg-slate-900/20 border border-white/5 border-dashed rounded-lg">
            <p className="text-[11px] text-slate-500 leading-relaxed italic">
              No speakers detected.<br/>
              Use <span className="text-slate-400 font-mono">Speaker: Text</span> format<br/>
              or click Auto Detect.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
