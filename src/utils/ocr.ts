import { extractTextFromImage } from 'expo-text-extractor';
import { componentTokens } from '../theme';

export interface OcrLine {
  text: string;
  top: number;     // vertical position on the image
  left: number;    // horizontal position
  height: number;
}

export async function readLines(uri: string): Promise<OcrLine[]> {
  const lines = (await extractTextFromImage(uri)).map((text, index) => ({
    text: text.replace(/\s+/g, ' ').trim(),
    top: index * 12,
    left: 0,
    height: componentTokens.ocr.lineHeight,
  }));
  // read top to bottom, then left to right
  return lines.filter((l) => l.text).sort((a, b) => a.top - b.top || a.left - b.left);
}
