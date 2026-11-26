export interface ScanLine {
  text: string;
  top: number;
  left: number;
  height: number;
}

export interface ScanResult {
  text: string;
  lines: ScanLine[];
  uri: string;
}

export class ScanError extends Error {}

export async function scanText(): Promise<ScanResult | null> {
  throw new ScanError('OCR scanning is available in the Android/iOS development build only.');
}
