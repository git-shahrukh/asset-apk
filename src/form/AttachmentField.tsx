import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getDocumentAsync } from 'expo-document-picker';
import { launchCameraAsync, requestCameraPermissionsAsync } from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { PickedFile } from '../api/types';
import { AnimatedPressable, Button, Surface, showPopup } from '../components/ui';
import { componentTokens, shape, spacing, typography, useTheme } from '../theme';
import type { FieldProps } from './fieldComponents';

const MAX_ATTACHMENTS = 5;

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

export function AttachmentField({ value, onChange, onBlur, hasError }: FieldProps) {
  const { theme } = useTheme();
  const [busy, setBusy] = useState(false);
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
      const { latitude, longitude } = await getCoords();
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
        <View style={styles.actionButton}>
          <Button title="Camera" onPress={takePhoto} loading={busy} disabled={full} hasError={hasError} variant="secondary" icon="camera-outline" />
        </View>
        <View style={styles.actionButton}>
          <Button title="Choose files" onPress={pickDocuments} disabled={busy || full} hasError={hasError} variant="secondary" icon="attach-outline" />
        </View>
      </View>

      <Text style={[styles.count, { color: theme.colors.textSecondary }]}>{files.length} / {MAX_ATTACHMENTS} attached</Text>

      {files.map((file, index) => (
        <Surface key={`${file.uri}-${index}`} style={[styles.item, { borderColor: hasError ? theme.colors.error : theme.colors.outline }]} outlined>
          <View style={[styles.fileIcon, { backgroundColor: theme.colors.primaryContainer }]}>
            <Ionicons name="document-attach-outline" size={componentTokens.iconSize.medium} color={theme.colors.primary} />
          </View>
          <View style={styles.fileMeta}>
            <Text numberOfLines={1} style={[styles.name, { color: theme.colors.textPrimary }]}>{file.name}</Text>
            {file.latitude != null && file.longitude != null && (
              <Text style={[styles.coords, { color: theme.colors.textSecondary }]}>Location: {file.latitude.toFixed(5)}, {file.longitude.toFixed(5)}</Text>
            )}
          </View>
          <AnimatedPressable onPress={() => remove(index)} style={styles.removeButton} accessibilityLabel={`Remove ${file.name}`}>
            <Ionicons name="trash-outline" size={componentTokens.iconSize.medium} color={theme.colors.error} />
          </AnimatedPressable>
        </Surface>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1 },
  count: { ...typography.bodySmall, marginTop: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, padding: spacing.md, borderRadius: shape.medium },
  fileIcon: { width: componentTokens.touchTarget.minimum, height: componentTokens.touchTarget.minimum, borderRadius: shape.medium, alignItems: 'center', justifyContent: 'center' },
  fileMeta: { flex: 1, minWidth: 0 },
  name: { ...typography.bodySmall },
  coords: { ...typography.label, marginTop: spacing.xs },
  removeButton: { padding: spacing.xs },
});
