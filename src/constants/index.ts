export const TTS_VOICES = [
  { id: 'Puck', label: 'Male: Puck' },
  { id: 'Charon', label: 'Male: Charon' },
  { id: 'Kore', label: 'Female: Kore' },
  { id: 'Fenrir', label: 'Male: Fenrir' },
  { id: 'Aoede', label: 'Female: Aoede' }
];

export const VOXCPM_VOICES = [
  { id: 'alloy', label: 'Neutral: Alloy' },
  { id: 'echo', label: 'Male: Echo' },
  { id: 'fable', label: 'British Male: Fable' },
  { id: 'onyx', label: 'Deep Male: Onyx' },
  { id: 'nova', label: 'Female: Nova' },
  { id: 'shimmer', label: 'Clear Female: Shimmer' }
];

export const SPEAKER_COLORS = [
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
];

export const EMOTIONS = [
  { id: 'angry', label: 'Angry', icon: '🔥', color: 'text-red-500', bg: 'bg-red-500/20', glow: 'shadow-red-500/50', border: 'border-red-500/50' },
  { id: 'calm', label: 'Calm', icon: '❄', color: 'text-blue-400', bg: 'bg-blue-400/20', glow: 'shadow-blue-400/50', border: 'border-blue-400/50' },
  { id: 'nervous', label: 'Nervous', icon: '⚡', color: 'text-yellow-400', bg: 'bg-yellow-400/20', glow: 'shadow-yellow-400/50', border: 'border-yellow-400/50' },
  { id: 'sad', label: 'Sad', icon: '💧', color: 'text-purple-400', bg: 'bg-purple-400/20', glow: 'shadow-purple-400/50', border: 'border-purple-400/50' },
  { id: 'sarcastic', label: 'Sarcastic', icon: '🎭', color: 'text-green-400', bg: 'bg-green-400/20', glow: 'shadow-green-400/50', border: 'border-green-400/50' },
  { id: 'seductive', label: 'Seductive', icon: '💋', color: 'text-pink-400', bg: 'bg-pink-400/20', glow: 'shadow-pink-400/50', border: 'border-pink-400/50' },
  { id: 'cold', label: 'Cold', icon: '🧊', color: 'text-cyan-300', bg: 'bg-cyan-300/20', glow: 'shadow-cyan-300/50', border: 'border-cyan-300/50' },
  { id: 'commanding', label: 'Commanding', icon: '📢', color: 'text-orange-500', bg: 'bg-orange-500/20', glow: 'shadow-orange-500/50', border: 'border-orange-500/50' },
  { id: 'exhausted', label: 'Exhausted', icon: '😴', color: 'text-slate-400', bg: 'bg-slate-400/20', glow: 'shadow-slate-400/50', border: 'border-slate-400/50' },
  { id: 'arrogant', label: 'Arrogant', icon: '💅', color: 'text-rose-400', bg: 'bg-rose-400/20', glow: 'shadow-rose-400/50', border: 'border-rose-400/50' },
  { id: 'scared', label: 'Scared', icon: '😨', color: 'text-amber-300', bg: 'bg-amber-300/20', glow: 'shadow-amber-300/50', border: 'border-amber-300/50' },
  { id: 'childish', label: 'Childish', icon: '🧸', color: 'text-lime-400', bg: 'bg-lime-400/20', glow: 'shadow-lime-400/50', border: 'border-lime-400/50' },
  { id: 'confident', label: 'Confident', icon: '🦁', color: 'text-indigo-400', bg: 'bg-indigo-400/20', glow: 'shadow-indigo-400/50', border: 'border-indigo-400/50' },
  { id: 'emotional', label: 'Emotional', icon: '🫂', color: 'text-violet-400', bg: 'bg-violet-400/20', glow: 'shadow-violet-400/50', border: 'border-violet-400/50' },
  { id: 'shouting', label: 'Shouting', icon: '🔊', color: 'text-red-600', bg: 'bg-red-600/20', glow: 'shadow-red-600/50', border: 'border-red-600/50' },
  { id: 'whispering', label: 'Whispering', icon: '🤫', color: 'text-teal-400', bg: 'bg-teal-400/20', glow: 'shadow-teal-400/50', border: 'border-teal-400/50' },
  { id: 'crying', label: 'Crying', icon: '😭', color: 'text-blue-500', bg: 'bg-blue-500/20', glow: 'shadow-blue-500/50', border: 'border-blue-500/50' },
  { id: 'fast', label: 'Fast', icon: '🏃', color: 'text-emerald-400', bg: 'bg-emerald-400/20', glow: 'shadow-emerald-400/50', border: 'border-emerald-400/50' },
  { id: 'slow', label: 'Slow', icon: '🐢', color: 'text-orange-400', bg: 'bg-orange-400/20', glow: 'shadow-orange-400/50', border: 'border-orange-400/50' },
];

export const DEFAULT_EMOTION_DATA = {
  emotions: ['calm'],
  tone: 'normal',
  energy: 0.5,
  speed: 1.0,
};
