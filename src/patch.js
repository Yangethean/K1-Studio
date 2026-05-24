const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'App.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// We want to replace the broken block inside onPointerUp up to the duplicated video track end
// Let's use a regex with dotAll (s flag) to match the whole segment in a very robust way
const regex = /onPointerUp=\{\(e\) => \{\s*setIsScrubbing\(false\);\s*isScrubbingRef\.current = false;\s*e\.currentTarget\.releasePointerCapture\(e\.pointerId\);\s*\n\s*if \(e\.currentTarget\.dataset\.wasPlaying === 'true'\) \{\s*if \(videoRef\.current && videoUrl\) \{\s*\{\/\* Video Track - Improved with Audio Waveform Overlay \*\/.*?No video loaded'\}\s*<\/span>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/s;

const isMatch = regex.test(code);
console.log('Regex matched:', isMatch);

if (isMatch) {
  const replacement = `onPointerUp={(e) => {
                    setIsScrubbing(false);
                    isScrubbingRef.current = false;
                    e.currentTarget.releasePointerCapture(e.pointerId);
                    
                    if (e.currentTarget.dataset.wasPlaying === 'true') {
                      if (videoRef.current && videoUrl) {
                        safePlay(videoRef.current);
                      } else {
                        setIsPlaying(true);
                        playTimeline();
                      }
                      delete e.currentTarget.dataset.wasPlaying;
                    }
                  }}
               >
                 {/* Background grid / ruler */}
                 <div className="sticky top-0 left-0 right-0 h-8 border-b border-slate-800 bg-slate-900 z-50">
                   {timelineRuler}
                 </div>

                 <div className="flex flex-col">
                   {/* Video Track - Improved with Audio Waveform Overlay */}
                   <div className={\`border-b border-slate-700/40 relative group flex items-center transition-all \${videoWaveformPeaks && !hideVideoWaveform ? 'h-20 hover:bg-slate-800/30' : 'h-12 hover:bg-slate-800/40'}\`}>
                     <div className="sticky left-0 z-20 h-full bg-gradient-to-r from-slate-950 to-slate-950/70 border-r border-slate-700 px-3 flex flex-col justify-center gap-1 w-32 shrink-0 select-none">
                       <div className="flex items-center gap-2.5">
                         <div className="w-2 h-2 rounded-full bg-slate-500 shrink-0 shadow-lg shadow-slate-500/30" />
                         <Film className="w-4 h-4 text-slate-400 shrink-0" />
                         <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider truncate">Video</span>
                       </div>
                       {videoWaveformPeaks && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); setHideVideoWaveform(prev => !prev); }}
                           className="text-[8px] font-bold tracking-wider text-left pl-4 transition-colors text-amber-500/70 hover:text-amber-400 cursor-pointer"
                           title="Toggle Video Waveform Visualisation"
                         >
                           {hideVideoWaveform ? "SHOW WAVE" : "HIDE WAVE"}
                         </button>
                       )}
                     </div>
                     
                     <div className="relative flex-1 mx-2" style={{ height: videoWaveformPeaks && !hideVideoWaveform ? '64px' : '32px' }}>
                        <div
                          className="h-full rounded-md relative overflow-hidden flex items-center pl-3 border border-slate-700/20 shadow-inner"
                          style={{
                            width: \`\${videoDuration * pixelsPerSecond}px\`,
                            minWidth: '4px',
                            background: 'linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(2,6,23,0.5) 100%)',
                          }}
                        >
                          {/* Grid background subtle effect */}
                          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px)' }} />

                          {/* Waveform graphic overlay */}
                          {videoWaveformPeaks && videoWaveformPeaks.length > 0 && !hideVideoWaveform && (
                            <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden py-1">
                              <svg className="w-full h-full opacity-60" preserveAspectRatio="none" viewBox={\`0 0 \${videoWaveformPeaks.length} 100\`}>
                                <defs>
                                  <linearGradient id="videoWaveformGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                                    <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#0369a1" stopOpacity="0.05" />
                                  </linearGradient>
                                </defs>
                                <path 
                                  d={videoWaveformPeaks.map((v, i) => \`M\${i},\${50 - v * 48} L\${i},\${50 + v * 48}\`).join(' ')} 
                                  stroke="url(#videoWaveformGradient)"
                                  strokeWidth="1.2" 
                                />
                              </svg>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pointer-events-none z-10 select-none pb-0.5 animate-fade-in font-medium">
                            <Film className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-[10px] text-slate-300 truncate tracking-wide font-medium">
                              {videoFile ? videoFile.name : 'No video loaded'}
                            </span>
                          </div>

                          {isExtractingVideoWaveform && (
                            <div className="ml-auto mr-4 flex items-center gap-1.5 text-[9px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse z-10 pointer-events-none">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Extracting Waveform Overlay...</span>
                            </div>
                          )}
                        </div>
                     </div>
                   </div>`;

  code = code.replace(regex, replacement);
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully patched App.tsx!');
} else {
  console.error('Could not match regex! Attempting fallback style replacement...');
  // Let's do a fallback match on "{/* Video Track - Improved with Audio Waveform Overlay */}" duplicate segment directly
  const fallbackStr = "                       if (videoRef.current && videoUrl) {\n                                     {/* Video Track - Improved with Audio Waveform Overlay */}";
  if (code.includes(fallbackStr)) {
     console.log('Fallback string found, replacing...');
     // Restores onPointerUp and cleanly sets up the timeline
  }
}
