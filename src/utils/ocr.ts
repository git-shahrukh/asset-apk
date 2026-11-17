import TextRecognition from '@react-native-ml-kit/text-recognition';

export interface OcrLine {
  text: string;
  top: number;     // vertical position on the image
  left: number;    // horizontal position
  height: number;
}

export async function readLines(uri: string): Promise<OcrLine[]> {
  const result = await TextRecognition.recognize(uri);
  const lines = result.blocks.flatMap((b) =>
    b.lines.map((l) => ({
      text: l.text.replace(/\s+/g, ' ').trim(),
      top: l.frame?.top ?? 0,
      left: l.frame?.left ?? 0,
      height: l.frame?.height ?? 0,
    })),
  );
  // read top to bottom, then left to right
  return lines.filter((l) => l.text).sort((a, b) => a.top - b.top || a.left - b.left);
}