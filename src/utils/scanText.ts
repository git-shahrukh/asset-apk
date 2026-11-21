// import { launchCameraAsync, requestCameraPermissionsAsync } from 'expo-image-picker';
// import TextRecognition from '@react-native-ml-kit/text-recognition';

// export interface ScanLine {
//   text: string;
//   top: number;
//   left: number;
// }

// export interface ScanResult {
//   text: string;
//   lines: ScanLine[];
// }

// // Thrown for expected problems, so the caller can show a friendly message.
// export class ScanError extends Error {}

// // Opens the camera, reads the text in the photo and returns it.
// // Returns null if the user cancels. Throws ScanError for permission or read problems.
// export async function scanText(): Promise<ScanResult | null> {
//   const perm = await requestCameraPermissionsAsync();
//   if (!perm.granted) throw new ScanError('Allow camera access to scan.');

//   // allowsEditing off: the crop screen returns a bad URI on some Oppo/Realme phones
//   const photo = await launchCameraAsync({ quality: 0.8, allowsEditing: false });
//   if (photo.canceled) return null;

//   const uri = photo.assets?.[0]?.uri;
//   if (!uri) throw new ScanError('No image was returned.');
//   console.log('photo uri:', uri);

//   const result = await TextRecognition.recognize(uri);
//   const lines = result.blocks.flatMap((b) =>
//     b.lines.map((l) => ({
//       text: l.text,
//       top: Math.round(l.frame?.top ?? 0),
//       left: Math.round(l.frame?.left ?? 0),
//     })),
//   );
//   return { text: result.text, lines };
// }

// export async function scanText(): Promise<ScanResult | null> {
//   let step = 'permission';
//   try {
//     const perm = await requestCameraPermissionsAsync();
//     if (!perm.granted) throw new ScanError('Allow camera access to scan.');

//     step = 'camera';
//     const photo = await launchCameraAsync({ quality: 0.8, allowsEditing: false });
//     if (photo.canceled) return null;

//     const uri = photo.assets?.[0]?.uri;
//     if (!uri) throw new ScanError('No image was returned.');
//     console.log('photo uri:', uri);

//     step = 'ocr';
//     const result = await TextRecognition.recognize(uri);
//     const lines = result.blocks.flatMap((b) =>
//       b.lines.map((l) => ({ text: l.text, top: Math.round(l.frame?.top ?? 0), left: Math.round(l.frame?.left ?? 0) })),
//     );
//     return { text: result.text, lines };
//   } catch (e) {
//     if (e instanceof ScanError) throw e;
//     throw new ScanError(`Failed at "${step}": ${String(e)}`);
//   }
// }

import { launchCameraAsync, requestCameraPermissionsAsync } from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';

export interface ScanLine {
  text: string;
  top: number;
  left: number;
}

export interface ScanResult {
  text: string;
  lines: ScanLine[];
}

// Thrown for expected problems, so the caller can show a friendly message.
export class ScanError extends Error {}

// Opens the camera, reads the text in the photo and returns it.
// Returns null if the user cancels. Throws ScanError for permission or read problems.
export async function scanText(): Promise<ScanResult | null> {
  let step = 'permission';
  try {
    const perm = await requestCameraPermissionsAsync();
    if (!perm.granted) throw new ScanError('Allow camera access to scan.');

    step = 'camera';
    // allowsEditing off: the crop screen returns a bad URI on some Oppo/Realme phones
    const photo = await launchCameraAsync({ quality: 0.8, allowsEditing: false });
    if (photo.canceled) return null;

    const uri = photo.assets?.[0]?.uri;
    if (!uri) throw new ScanError('No image was returned.');
    console.log('photo uri:', uri);

    step = 'ocr';
    const result = await TextRecognition.recognize(uri);
    const lines = result.blocks.flatMap((b) =>
      b.lines.map((l) => ({
        text: l.text,
        top: Math.round(l.frame?.top ?? 0),
        left: Math.round(l.frame?.left ?? 0),
      })),
    );
    return { text: result.text, lines };
  } catch (e) {
    if (e instanceof ScanError) throw e;
    throw new ScanError(`Failed at "${step}": ${String(e)}`);
  }
}