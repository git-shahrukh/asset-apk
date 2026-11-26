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
import ImageCropPicker from 'react-native-image-crop-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';

export interface ScanLine {
  text: string;
  top: number;
  left: number;
  height: number;          // NEW: parseScan needs this to group rows
}

export interface ScanResult {
  text: string;
  lines: ScanLine[];
  uri: string;             // cropped image, handy for preview
}

export class ScanError extends Error {}

export async function scanText(): Promise<ScanResult | null> {
  
  let step = 'permission';
  try {
    const perm = await requestCameraPermissionsAsync();
    if (!perm.granted) throw new ScanError('Allow camera access to scan.');

    step = 'camera';
    // allowsEditing stays off (bad URI on some Oppo/Realme phones). We crop separately.
    const photo = await launchCameraAsync({ quality: 0.8, allowsEditing: false });
    if (photo.canceled) return null;
    const rawUri = photo.assets?.[0]?.uri;
    if (!rawUri) throw new ScanError('No image was returned.');

       step = 'crop';
    let uri = rawUri;
    try {
      const cropped = await ImageCropPicker.openCropper({
        path: rawUri,
        mediaType: 'photo',            // required by the library's types
        freeStyleCropEnabled: true,    // drag any edge, not a fixed ratio
        cropperToolbarTitle: 'Crop the label',
        compressImageQuality: 0.9,
      });
      uri = cropped.path;
    } catch (e: any) {
      if (e?.code === 'E_PICKER_CANCELLED') return null;   // user backed out
      console.warn('crop failed, using full photo', e);     // fallback: scan uncropped
    }
    step = 'ocr';
    const result = await TextRecognition.recognize(uri);
    const lines: ScanLine[] = result.blocks.flatMap((b) =>
      b.lines.map((l) => ({
        text: l.text.replace(/\s+/g, ' ').trim(),
        top: Math.round(l.frame?.top ?? 0),
        left: Math.round(l.frame?.left ?? 0),
        height: Math.round(l.frame?.height ?? 0),
      })),
    ).filter((l) => l.text);

    return { text: result.text, lines, uri };
  } catch (e) {
    if (e instanceof ScanError) throw e;
    throw new ScanError(`Failed at "${step}": ${String(e)}`);
  }
}