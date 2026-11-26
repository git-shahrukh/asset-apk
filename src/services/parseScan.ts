// import { DESCRIPTION_LABELS, SYNONYM_GROUPS, TEXT_TYPES, norm } from './fieldMap';
// import type { ScanLine } from '../utils/scanText';

// export interface FormField { key: string; label: string; type?: string }

// export interface ParsedScan {
//   values: Record<string, string>;
//   description: string;
//   descriptionKey: string | null;
// }

// const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// function buildMatchers(fields: FormField[]) {
//   const matchers: { key: string; re: RegExp; len: number }[] = [];

//   for (const f of fields) {
//     if (!TEXT_TYPES.includes(f.type as any)) continue;
//     if (DESCRIPTION_LABELS.includes(norm(f.label))) continue;

//     const label = norm(f.label);
//     const group = SYNONYM_GROUPS.find((g) => g.includes(label)) ?? [];
//     const aliases = Array.from(new Set([label, ...group]));

//     for (const a of aliases) {
//       matchers.push({
//         key: f.key,
//         re: new RegExp(`^\\s*${escape(a)}\\b\\s*[:\\-=#.]*\\s*(.*)$`, 'i'),
//         len: a.length,
//       });
//     }
//   }
//   return matchers.sort((a, b) => b.len - a.len);
// }

// function toRows(lines: ScanLine[]): string[] {
//   const sorted = [...lines].sort((a, b) => a.top - b.top);
//   const rows: ScanLine[][] = [];
//   for (const l of sorted) {
//     const last = rows[rows.length - 1];
//     const tolerance = Math.max(l.height, 10) * 0.6;
//     if (last && Math.abs(l.top - last[0].top) <= tolerance) last.push(l);
//     else rows.push([l]);
//   }
//   return rows.map((r) =>
//     r.sort((a, b) => a.left - b.left).map((l) => l.text.trim()).join(' : '),
//   );
// }

// export function parseScan(lines: ScanLine[], fields: FormField[]): ParsedScan {
//   const matchers = buildMatchers(fields);
//   const matchLabel = (text: string) => {
//     for (const m of matchers) {
//       const hit = text.match(m.re);
//       if (hit) return { key: m.key, value: hit[1].trim() };
//     }
//     return null;
//   };

//   const rows = toRows(lines);
//   const values: Record<string, string> = {};
//   const leftovers: string[] = [];

//   for (let i = 0; i < rows.length; i++) {
//     const hit = matchLabel(rows[i]);
//     if (!hit) { leftovers.push(rows[i]); continue; }

//     let value = hit.value.replace(/^[:\-\s]+/, '');

//     if (!value && rows[i + 1] && !matchLabel(rows[i + 1])) {
//       value = rows[i + 1].trim();
//       i++;
//     }

//     if (value && !values[hit.key]) values[hit.key] = value;
//     else leftovers.push(rows[i]);
//   }

//   const descField = fields.find((f) => DESCRIPTION_LABELS.includes(norm(f.label)));
//   return {
//     values,
//     description: leftovers.join('\n'),
//     descriptionKey: descField?.key ?? null,
//   };
// }
import type { Field } from '../api/types';
import type { ScanLine } from '../utils/scanText';
import { SYNONYM_GROUPS, TEXT_TYPES, isDescription, norm } from './fieldMap';

export interface ParsedScan {
  values: Record<string, string>;   // field.id → text
  description: string;
  descriptionId: string | null;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function buildMatchers(fields: Field[]) {
  const matchers: { id: string; re: RegExp; len: number }[] = [];

  for (const f of fields) {
    if (!TEXT_TYPES.includes(f.type)) continue;
    if (isDescription(f.label)) continue;

    const label = norm(f.label);
    const group = SYNONYM_GROUPS.find((g) => g.includes(label)) ?? [];
    const aliases = Array.from(new Set([label, ...group]));

    for (const a of aliases) {
      matchers.push({
        id: f.id,
        re: new RegExp(`^\\s*${escape(a)}\\b\\s*[:\\-=#.]*\\s*(.*)$`, 'i'),
        len: a.length,
      });
    }
  }
  return matchers.sort((a, b) => b.len - a.len);
}

// Lines whose vertical CENTRES are close are one visual row (label box + value box).
function toRows(lines: ScanLine[]): string[] {
  const centre = (l: ScanLine) => l.top + l.height / 2;
  const sorted = [...lines].sort((a, b) => centre(a) - centre(b));
  const rows: ScanLine[][] = [];

  for (const l of sorted) {
    const last = rows[rows.length - 1];
    if (last) {
      const first = last[0];
      const tolerance = Math.min(l.height, first.height) * 0.5;
      if (Math.abs(centre(l) - centre(first)) <= tolerance) { last.push(l); continue; }
    }
    rows.push([l]);
  }
  return rows.map((r) =>
    r.sort((a, b) => a.left - b.left).map((l) => l.text.trim()).join(' : '),
  );
}

export function parseScan(lines: ScanLine[], fields: Field[]): ParsedScan {
  const matchers = buildMatchers(fields);
  const matchLabel = (text: string) => {
    for (const m of matchers) {
      const hit = text.match(m.re);
      if (hit) return { id: m.id, value: hit[1].trim() };
    }
    return null;
  };

  const rows = toRows(lines);
  console.log('SCAN rows:', rows);                                // debug: what the parser sees

  const values: Record<string, string> = {};
  const leftovers: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const hit = matchLabel(rows[i]);
    if (!hit) { leftovers.push(rows[i]); continue; }

    let value = hit.value
      .replace(/^[:\-\s]+/, '')
      .replace(/^\S{1,2}\s:\s/, '');          // OCR noise: "Tag No:L : NA" → "NA"

    if (!value && rows[i + 1] && !matchLabel(rows[i + 1])) {
      value = rows[i + 1].trim();
      i++;
    }

    if (value && !values[hit.id]) values[hit.id] = value;
    else leftovers.push(rows[i]);
  }

  const descField = fields.find((f) => isDescription(f.label));
  return {
    values,
    description: leftovers.join('\n'),
    descriptionId: descField?.id ?? null,
  };
}