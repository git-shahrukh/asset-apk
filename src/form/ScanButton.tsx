import { useState } from 'react';
import { launchCameraAsync, requestCameraPermissionsAsync } from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { Button, showPopup } from '../components/ui';
import type { OcrLine } from './ocrFill';

export function ScanButton({ onScan }: { onScan: (text: string, lines: OcrLine[]) => void }) {
  const [busy, setBusy] = useState(false);

  const scan = async () => {
    const perm = await requestCameraPermissionsAsync();
    if (!perm.granted) return showPopup('Permission needed', 'Allow camera access.');
    const photo = await launchCameraAsync({ quality: 0.8 });
    if (photo.canceled) return;

    setBusy(true);
    try {
      const r = await TextRecognition.recognize(photo.assets[0].uri);
      const lines = r.blocks.flatMap((b) =>
        b.lines.map((l) => ({ text: l.text, top: l.frame?.top ?? 0, left: l.frame?.left ?? 0 })),
      );
      onScan(r.text, lines);
    } catch (e) {
      showPopup('Scan failed', String(e));
    } finally {
      setBusy(false);
    }
  };

  return <Button title="Scan nameplate" onPress={scan} loading={busy} />;
}