import { Subtitle } from '../lib/workspace-types';
import { parseTime } from './TimeService';
import { DEFAULT_EMOTION_DATA } from '../constants';

export function detectLocalKeywords(text: string) {
  const data = { ...DEFAULT_EMOTION_DATA };
  
  if (text.includes('!')) {
    data.emotions = ['confident'];
    data.energy = 0.8;
  }
  if (text.includes('?')) {
    data.emotions = ['nervous'];
    data.tone = 'questioning';
  }
  if (text.includes('...')) {
    data.emotions = ['sad'];
    data.energy = 0.3;
  }
  if (text === text.toUpperCase() && text.length > 3) {
    data.emotions = ['shouting'];
    data.energy = 0.9;
  }
  
  return data;
}

export function cleanTextForTTS(text: string): string {
  return text
    .replace(/^Speaker\s*\d+\s*(\([^)]*\))?\s*:\s*/gim, "") // Remove "Speaker 1 (angry): "
    .replace(/^Default Speaker\s*:\s*/gim, "") // Remove "Default Speaker: "
    .replace(/^\([^)]*\)\s*/gm, "") // Remove leading "(shouting) "
    .replace(/\([^)]+\)/g, "") // Remove any remaining (metadata)
    .replace(/\[[^\]]+\]/g, "") // Remove any remaining [metadata]
    .trim();
}

export function detectSpeaker(text: string): { speakerName: string; cleanText: string } {
  // Priority patterns: Speaker 1:, Default Speaker:, Character Name:
  const patterns = [
    /^(Speaker\s*\d+)\s*[:\s]*(.*)/si,
    /^(Default Speaker)\s*[:\s]*(.*)/si,
    /^\[([^\]]+)\][:\s]*(.*)/s,    
    /^\(([^)]+)\)[:\s]*(.*)/s,    
    /^([^:\n]+):[:\s]*(.*)/s,    
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern.source.includes('^([^:\n]+):') && match[1].length > 25) continue;
      return { speakerName: match[1].trim(), cleanText: match[2].trim() };
    }
  }

  return { speakerName: 'Default Speaker', cleanText: text.trim() };
}

export function parseSRT(srt: string): Subtitle[] {
  const normalized = srt.replace(/\r\n/g, '\n');
  const blocks = normalized.split('\n\n');
  const subtitles: Subtitle[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length >= 3) {
      const id = parseInt(lines[0], 10);
      const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
      if (timeMatch) {
         const startTime = parseTime(timeMatch[1]);
         const endTime = parseTime(timeMatch[2]);
         const text = lines.slice(2).join(' ').trim();
         if (text) {
           const { speakerName, cleanText } = detectSpeaker(text);
           subtitles.push({ 
             id, 
             startTime, 
             endTime, 
             text, 
             cleanText,
             speakerId: speakerName,
             voice: 'default', 
             audioStartTime: startTime, 
             isLinked: true 
           });
         }
      }
    }
  }
  return subtitles;
}
