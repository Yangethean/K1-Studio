import React from 'react';
import { motion } from 'motion/react';
import { HelpCircle, Settings, X } from 'lucide-react';
import { formatKeyCode } from '../services/TimeService';

export interface ShortcutsModalProps {
  showShortcuts: boolean;
  setShowShortcuts: (show: boolean) => void;
  customHotkeys: Record<string, string>;
  setCustomHotkeys: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  activeHotkeyRecording: string | null;
  setActiveHotkeyRecording: (key: string | null) => void;
}

export const ShortcutsModal = ({
  showShortcuts,
  setShowShortcuts,
  customHotkeys,
  setCustomHotkeys,
  activeHotkeyRecording,
  setActiveHotkeyRecording,
}: ShortcutsModalProps) => {
  if (!showShortcuts) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm shadow-2xl" onClick={() => setShowShortcuts(false)}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden text-left" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-white">Keyboard Shortcuts & Hotkeys</h3>
          </div>
          <button onClick={() => setShowShortcuts(false)} className="p-1 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Playback</h4>
              <div className="flex justify-between items-center bg-slate-950/50 p-2 rounded border border-slate-800/50">
                <span className="text-slate-400">Play / Pause</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-amber-500 font-mono text-xs shadow-sm shadow-black/40 border border-slate-700/50">Space</kbd>
              </div>
              <div className="flex justify-between items-center bg-slate-950/50 p-2 rounded border border-slate-800/50">
                <span className="text-slate-400">Step Back</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-amber-500 font-mono text-xs shadow-sm shadow-black/40 border border-slate-700/50">←</kbd>
              </div>
              <div className="flex justify-between items-center bg-slate-950/50 p-2 rounded border border-slate-800/50">
                <span className="text-slate-400">Step Forward</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-amber-500 font-mono text-xs shadow-sm shadow-black/40 border border-slate-700/50">→</kbd>
              </div>
              <div className="flex justify-between items-center bg-slate-950/50 p-2 rounded border border-slate-800/50">
                <span className="text-slate-400">1s Jump</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-amber-500 font-mono text-xs shadow-sm shadow-black/40 border border-slate-700/50">Shift + ←/→</kbd>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Editor</h4>
              <div className="flex justify-between items-center bg-slate-950/50 p-2 rounded border border-slate-800/50">
                <span className="text-slate-400">Prev Subtitle</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-amber-500 font-mono text-xs shadow-sm shadow-black/40 border border-slate-700/50">↑</kbd>
              </div>
              <div className="flex justify-between items-center bg-slate-950/50 p-2 rounded border border-slate-800/50">
                <span className="text-slate-400">Next Subtitle</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-amber-500 font-mono text-xs shadow-sm shadow-black/40 border border-slate-700/50">↓</kbd>
              </div>
              <div className="flex justify-between items-center bg-slate-950/50 p-2 rounded border border-slate-800/50">
                <span className="text-slate-400">Delete Clip</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-amber-500 font-mono text-xs shadow-sm shadow-black/40 border border-slate-700/50">Del / BS</kbd>
              </div>
              <div className="flex justify-between items-center bg-slate-950/50 p-2 rounded border border-slate-800/50">
                <span className="text-slate-400">Keyboard help</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-amber-500 font-mono text-xs shadow-sm shadow-black/40 border border-slate-700/50">?</kbd>
              </div>
            </div>
            <div className="col-span-1 md:col-span-2 space-y-4 border-t border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Timeline Navigation</h4>
              <div className="flex justify-between items-center bg-slate-950/50 p-2 rounded border border-slate-800/50 text-xs">
                <span className="text-slate-400">Zoom Canvas</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded text-amber-500 font-mono text-xs shadow-sm shadow-black/40 border border-slate-700/50">Ctrl / ⌘ + (+/-)</kbd>
              </div>
            </div>
          </div>

          {/* Customizable Hotkeys section */}
          <div className="border-t border-slate-800 pt-5 space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Settings className="w-4 h-4 text-amber-500 animate-[spin_5s_linear_infinite]" />
                  Manage Custom Hotkeys
                </h4>
                <p className="text-[11px] text-slate-500">Customize keyboard controls for dynamic tracks and subtitle speech groups</p>
              </div>
              <button 
                onClick={() => setCustomHotkeys({
                  toggleVideoTrack: 'KeyQ',
                  toggleTextTrack: 'KeyW',
                  toggleDubTrack: 'KeyE',
                  jumpPrevSpeakerGroup: 'BracketLeft',
                  jumpNextSpeakerGroup: 'BracketRight',
                })}
                className="text-[10px] text-amber-500 hover:text-amber-400 font-bold tracking-wider uppercase cursor-pointer flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 hover:bg-amber-500/20 active:scale-95 transition-all select-none"
              >
                Reset Defaults
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
              {[
                { id: 'toggleVideoTrack', label: 'Toggle Video Track Vis' },
                { id: 'toggleTextTrack', label: 'Toggle Subtitles Track Vis' },
                { id: 'toggleDubTrack', label: 'Toggle Dub Audio Track Vis' },
                { id: 'jumpPrevSpeakerGroup', label: 'Jump Prev Subtitle Group' },
                { id: 'jumpNextSpeakerGroup', label: 'Jump Next Subtitle Group' },
              ].map(item => {
                const isRecording = activeHotkeyRecording === item.id;
                const currentKey = customHotkeys[item.id];
                return (
                  <div key={item.id} className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 hover:border-slate-700/50 transition-colors">
                    <span className="text-xs font-medium text-slate-300">{item.label}</span>
                    <button
                      onClick={() => setActiveHotkeyRecording(isRecording ? null : item.id)}
                      className={`px-3 py-1.5 rounded text-xs font-mono select-none font-bold tracking-wide transition-all ${
                        isRecording 
                          ? 'bg-amber-400 text-slate-950 animate-pulse font-extrabold ring-2 ring-amber-400/50 duration-700' 
                          : 'bg-slate-800 hover:bg-slate-755 text-amber-500 border border-slate-700/60 hover:border-amber-500/30 active:scale-95'
                      }`}
                      title="Click to rebind this keyboard shortcut"
                    >
                      {isRecording ? 'RECORDING...' : formatKeyCode(currentKey)}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed italic bg-slate-950/30 p-2 border border-slate-850 rounded">
              Tip: Click any shortcut button above, then press any key on your keyboard to instantly rebind its action.
            </p>
          </div>
        </div>
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-xs text-slate-500 text-center italic">
          You can also drag handles on the timeline for fine-tuning audio start/end.
        </div>
      </motion.div>
    </div>
  );
};
