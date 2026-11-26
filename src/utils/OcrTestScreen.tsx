import { useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { launchCameraAsync, launchImageLibraryAsync, requestCameraPermissionsAsync } from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { Button, EmptyView, FormItem, Surface, showPopup } from '../components/ui';
import { componentTokens, shape, spacing, typography, useTheme } from '../theme';

interface Line { text: string; top: number; left: number }

function parseNameplate(text: string) {
  const model = (text.match(/m?odel\s*[:\-]?\s*([A-Z0-9][A-Z0-9 \-\/]+)/i)?.[1] ?? '').replace(/[|]/g, '').trim();
  const range = text.match(/range\s*[:\-]?\s*([^\n]+)/i)?.[1]?.trim();
  const output = text.match(/(\d+\s*to\s*\d+\s*m?a)/i)?.[1]?.trim();
  const specification = [range && `Range: ${range}`, output && `Output: ${output}`].filter(Boolean).join(', ');
  return { model, specification };
}

export default function OcrTestScreen() {
  const { theme } = useTheme();
  const [uri, setUri] = useState<string | null>(null);
  const [fullText, setFullText] = useState('');
  const [description, setDescription] = useState('');
  const [model, setModel] = useState('');
  const [specification, setSpecification] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const [ms, setMs] = useState<number | null>(null);

  const run = async (fromCamera: boolean) => {
    if (fromCamera) {
      const perm = await requestCameraPermissionsAsync();
      if (!perm.granted) return showPopup('Permission needed', 'Allow camera access.');
    }
    const photo = fromCamera
      ? await launchCameraAsync({ quality: 0.8 })
      : await launchImageLibraryAsync({ quality: 0.8 });
    if (photo.canceled) return;

    setUri(photo.assets[0].uri);
    setBusy(true);
    try {
      const start = Date.now();
      const result = await TextRecognition.recognize(photo.assets[0].uri);
      setMs(Date.now() - start);
      setFullText(result.text);
      setDescription(result.text);
      const parsed = parseNameplate(result.text);
      setModel(parsed.model);
      setSpecification(parsed.specification);
      setLines(result.blocks.flatMap((b) => b.lines.map((l) => ({ text: l.text, top: l.frame?.top ?? 0, left: l.frame?.left ?? 0 }))));
      if (__DEV__) console.log('OCR parsed field names:', Object.keys(parsed));
    } catch (e) {
      showPopup('Scan failed', String(e));
    } finally {
      setBusy(false);
    }
  };

  if (Platform.OS === 'web') {
    return <EmptyView title="OCR is unavailable on web" message="Use an Android or iOS development build to scan equipment labels." icon="scan-outline" />;
  }

  return (
    <ScrollView contentContainerStyle={[styles.wrap, { backgroundColor: theme.colors.background }]} keyboardShouldPersistTaps="handled">
      <Surface style={styles.introCard}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Label scanner</Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>Capture a nameplate and review the suggested values before using them.</Text>
        <View style={styles.actions}>
          <View style={styles.action}><Button title="Take photo" onPress={() => run(true)} loading={busy} icon="camera-outline" /></View>
          <View style={styles.action}><Button title="Gallery" onPress={() => run(false)} disabled={busy} variant="secondary" icon="images-outline" /></View>
        </View>
      </Surface>

      {uri && <Image source={{ uri }} style={[styles.img, { backgroundColor: theme.colors.textPrimary }]} resizeMode="contain" />}
      {ms !== null && <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Read in {ms} ms · {lines.length} lines</Text>}

      <Surface style={styles.contentCard}>
        <FormItem label="Description">
          <TextInput
            style={[styles.input, styles.multiline, { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.textPrimary, borderColor: theme.colors.outline }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Scanned text will appear here. You can also type."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            textAlignVertical="top"
          />
        </FormItem>
        <FormItem label="Model">
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.textPrimary, borderColor: theme.colors.outline }]}
            value={model}
            onChangeText={setModel}
            placeholder="Model"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </FormItem>
        <FormItem label="Specification">
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.textPrimary, borderColor: theme.colors.outline }]}
            value={specification}
            onChangeText={setSpecification}
            placeholder="e.g. Range: 0-5M, Output: 4 To 20 mA"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </FormItem>
      </Surface>

      {fullText ? (
        <Surface style={styles.contentCard}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Raw text</Text>
          <Text selectable style={[styles.box, { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.textPrimary }]}>{fullText}</Text>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Detected lines</Text>
          {lines.map((line, index) => (
            <Text key={index} style={[styles.line, { color: theme.colors.textSecondary }]}>
              {index + 1}. [{Math.round(line.top)}, {Math.round(line.left)}]  {line.text}
            </Text>
          ))}
        </Surface>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  introCard: { padding: spacing.lg },
  title: { ...typography.title },
  description: { ...typography.bodySmall, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  action: { flex: 1 },
  img: { width: '100%', height: componentTokens.image.previewHeight, borderRadius: shape.medium, marginTop: spacing.xs },
  meta: { ...typography.bodySmall },
  contentCard: { padding: spacing.lg },
  sectionTitle: { ...typography.title, marginBottom: spacing.sm },
  input: { minHeight: componentTokens.input.height, borderWidth: componentTokens.card.borderWidth, borderRadius: componentTokens.input.radius, padding: spacing.md, ...typography.body },
  multiline: { minHeight: componentTokens.image.previewHeight / 2 },
  box: { padding: spacing.md, borderRadius: shape.medium, ...typography.bodySmall, marginBottom: spacing.lg },
  line: { ...typography.bodySmall, paddingVertical: spacing.xs },
});
