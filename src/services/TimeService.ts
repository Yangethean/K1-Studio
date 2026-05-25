/**
 * TimeService
 * Pure business logic for parsing and formatting times, keycodes, and subtitles time stamps.
 */

export function parseTime(time: string): number {
  if (!time) return 0;
  const [hms, ms = "0"] = time.trim().replace(".", ",").split(",");
  const parts = hms.split(":").map(Number);

  let h = 0, m = 0, s = 0;

  if (parts.length === 3) {
    [h, m, s] = parts;
  } else if (parts.length === 2) {
    [m, s] = parts;
  } else {
    [s] = parts;
  }

  return h * 3600 + m * 60 + s + Number(ms.padEnd(3, "0").slice(0, 3)) / 1000;
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "00:00:00";

  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatKeyCode(code: string): string {
  if (!code) return 'None';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
  if (code === 'BracketLeft') return '[';
  if (code === 'BracketRight') return ']';
  if (code === 'Semicolon') return ';';
  if (code === 'Quote') return "'";
  if (code === 'Comma') return ',';
  if (code === 'Period') return '.';
  if (code === 'Slash') return '/';
  if (code === 'Backslash') return '\\';
  if (code === 'Backquote') return '`';
  if (code === 'Minus') return '-';
  if (code === 'Equal') return '=';
  return code;
}
