import { FIELDS } from './fieldMap';
import type { ScanLine } from '../utils/scanText';

export interface ParsedScan {
  values: Record<string, string>;   // key → value found
  description: string;              // everything that was not matched
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Flatten all aliases, longest first, so "asset name" wins over "name"
const MATCHERS = FIELDS.flatMap((f) =>
  f.aliases.map((a) => ({
    key: f.key,
    // alias at the start of the line, optional separator, then the value
    re: new RegExp(`^\\s*${escape(a)}\\b\\s*[:\\-=#.]*\\s*(.*)$`, 'i'),
    len: a.length,
  })),
).sort((a, b) => b.len - a.len);

function matchLabel(text: string) {
  for (const m of MATCHERS) {
    const hit = text.match(m.re);
    if (hit) return { key: m.key, value: hit[1].trim() };
  }
  return null;
}

// Lines on the same visual row (label and value in separate boxes) are joined into one string.
function toRows(lines: ScanLine[]): string[] {
  const sorted = [...lines].sort((a, b) => a.top - b.top);
  const rows: ScanLine[][] = [];
  for (const l of sorted) {
    const last = rows[rows.length - 1];
    const tolerance = Math.max(l.height, 10) * 0.6;
    if (last && Math.abs(l.top - last[0].top) <= tolerance) last.push(l);
    else rows.push([l]);
  }
  return rows.map((r) =>
    r.sort((a, b) => a.left - b.left).map((l) => l.text.trim()).join(' : '),
  );
}

export function parseScan(lines: ScanLine[]): ParsedScan {
  const rows = toRows(lines);
  const values: Record<string, string> = {};
  const leftovers: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const hit = matchLabel(rows[i]);

    if (!hit) {
      leftovers.push(rows[i]);
      continue;
    }

    let value = hit.value.replace(/^[:\-\s]+/, '');

    // Label alone on its row ("Serial No"), value on the next row
    if (!value && rows[i + 1] && !matchLabel(rows[i + 1])) {
      value = rows[i + 1].trim();
      i++; // skip the row we just consumed
    }

    if (value && !values[hit.key]) values[hit.key] = value;
    else if (!value) leftovers.push(rows[i]);
  }

  return { values, description: leftovers.join('\n') };
}