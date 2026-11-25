import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getDocumentAsync } from 'expo-document-picker';
import { launchCameraAsync, requestCameraPermissionsAsync } from 'expo-image-picker';
import * as Location from 'expo-location';
import { PickedFile } from '../api/types';
import { colors, showPopup } from '../components/ui';
import type { FieldProps } from './fieldComponents';

const MAX_ATTACHMENTS = 5; // change this number to change the limit

// Current position, or nulls if permission is denied or GPS fails.
async function getCoords(): Promise<{ latitude: number | null; longitude: number | null }> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { latitude: null, longitude: null };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return { latitude: null, longitude: null };
  }
}

export function AttachmentField({ field, value, onChange, onBlur, hasError }: FieldProps) {
  const [busy, setBusy] = useState(false);

  // Old saved values may be '' or a single file, so normalise to an array.
  const files: PickedFile[] = Array.isArray(value) ? value : value ? [value] : [];
  const remaining = MAX_ATTACHMENTS - files.length;
  const full = remaining <= 0;

  const add = (newFiles: PickedFile[]) => {
    onChange([...files, ...newFiles.slice(0, remaining)]);
    if (newFiles.length > remaining) showPopup('Limit reached', `You can attach up to ${MAX_ATTACHMENTS} files.`);
  };

  const remove = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
    onBlur();
  };

  const pickDocuments = async () => {
    if (full) return showPopup('Limit reached', `You can attach up to ${MAX_ATTACHMENTS} files.`);
    const result = await getDocumentAsync({ type: '*/*', multiple: true, base64: false });
    if (!result.canceled) {
      add(result.assets.map((a) => ({ uri: a.uri, name: a.name, mimeType: a.mimeType, file: a.file })));
    }
    onBlur();
  };

  const takePhoto = async () => {
    if (full) return showPopup('Limit reached', `You can attach up to ${MAX_ATTACHMENTS} files.`);
    setBusy(true);
    try {
      const perm = await requestCameraPermissionsAsync();
      if (!perm.granted) return showPopup('Permission needed', 'Allow camera access to take photos.');

      const result = await launchCameraAsync({ quality: 0.7 });
      if (result.canceled) return;

      const asset = result.assets[0];
      const { latitude, longitude } = await getCoords(); // taken right after the photo
      if (latitude == null) showPopup('Location unavailable', 'The photo was added without a location.');

      add([{
        uri: asset.uri,
        name: asset.fileName ?? `photo_${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
        file: asset.file,
        latitude,
        longitude,
      }]);
    } finally {
      setBusy(false);
      onBlur();
    }
  };

  return (
    <View>
      <View style={styles.row}>
        <Pressable onPress={takePhoto} disabled={busy || full} style={[styles.btn, hasError && styles.err, (busy || full) && styles.off]}>
          <Text style={styles.btnText}>{busy ? 'Please wait…' : 'Camera'}</Text>
        </Pressable>
        <Pressable onPress={pickDocuments} disabled={busy || full} style={[styles.btn, hasError && styles.err, (busy || full) && styles.off]}>
          <Text style={styles.btnText}>Choose files</Text>
        </Pressable>
      </View>

      <Text style={styles.count}>{files.length} / {MAX_ATTACHMENTS} attached</Text>

      {files.map((f, i) => (
        <View key={`${f.uri}-${i}`} style={styles.item}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={styles.name}>{f.name}</Text>
            {f.latitude != null && f.longitude != null && (
              <Text style={styles.coords}>📍 {f.latitude.toFixed(5)}, {f.longitude.toFixed(5)}</Text>
            )}
          </View>
          <Pressable onPress={() => remove(i)} hitSlop={8}>
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 13, alignItems: 'center', backgroundColor: colors.card },
  btnText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  err: { borderColor: colors.danger },
  off: { opacity: 0.5 },
  count: { color: colors.muted, fontSize: 13, marginTop: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  name: { fontSize: 15, color: colors.text },
  coords: { fontSize: 12, color: colors.muted, marginTop: 2 },
  remove: { color: colors.danger, fontSize: 15, fontWeight: '600' },
});
