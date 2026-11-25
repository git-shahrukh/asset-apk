export interface OcrLine { text: string; top: number; left: number }
export interface OcrField { id: string; label: string; type: string }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const clean = (s: string) => s.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
const PAIR = /^([A-Za-z][A-Za-z .\/]{1,30}?)\s*[:=]\s*(.*)$/;

// form label (lowercase, no spaces) -> scanned keys that fill it. Edit freely.
const ALIASES: Record<string, string[]> = {
  model: ['model', 'modelno', 'modelnumber', 'odel'],
  specification: ['range', 'outputsignal', 'output', 'accuracy', 'supply'],
  manufacturername: ['manufacturer', 'mfg', 'makeby'],
  assetsid: ['assetid', 'assetsid', 'assetno'],
};

// Reads "Label: value" pairs. If the value was read as a separate line,
// it takes the closest line to the right of the label.
export function extractPairs(lines: OcrLine[]) {
  const pairs: { key: string; value: string }[] = [];
  lines.forEach((l, i) => {
    const m = clean(l.text).match(PAIR);
    if (!m) return;
    const key = m[1].trim();
    let value = m[2].trim();
    if (!value) {
      const next = lines
        .filter((o, j) => j !== i && o.left > l.left && Math.abs(o.top - l.top) < 120 && !PAIR.test(clean(o.text)))
        .sort((a, b) => Math.abs(a.top - l.top) - Math.abs(b.top - l.top))[0];
      value = next ? clean(next.text) : '';
    }
    if (value) pairs.push({ key, value });
  });
  return pairs;
}

// Returns { [field.id]: text } for every text field that could be filled
export function matchFields(fields: OcrField[], fullText: string, lines: OcrLine[], maxLength: number) {
  const pairs = extractPairs(lines);
  const out: Record<string, string> = {};

  for (const f of fields) {
    if (f.type !== 'text') continue;
    const label = norm(f.label);

    if (label.includes('description')) {
      out[f.id] = fullText.slice(0, maxLength);
      continue;
    }

    const wanted = ALIASES[label] ?? [label];
    const hits = pairs.filter((p) =>
      wanted.some((w) => norm(p.key) === w || (w.length >= 4 && norm(p.key).includes(w))),
    );
    if (!hits.length) continue;

    const value = label === 'specification'
      ? hits.map((h) => `${h.key}: ${h.value}`).join(', ')
      : hits[0].value;
    out[f.id] = value.slice(0, maxLength);
  }
  return out;
}