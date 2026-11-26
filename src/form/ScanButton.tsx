import { useState } from 'react';
import { launchCameraAsync, requestCameraPermissionsAsync } from 'expo-image-picker';
import { extractTextFromImage } from 'expo-text-extractor';
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
      const texts = await extractTextFromImage(photo.assets[0].uri);
      const lines = texts.map((text, index) => ({ text, top: index * 12, left: 0 }));
      onScan(texts.join('\n'), lines);
    } catch (e) {
      showPopup('Scan failed', String(e));
    } finally {
      setBusy(false);
    }
  };

  return <Button title="Scan nameplate" onPress={scan} loading={busy} />;
}
