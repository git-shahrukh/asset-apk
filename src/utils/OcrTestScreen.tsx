// import { useState } from 'react';
// import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
// import { launchCameraAsync, launchImageLibraryAsync, requestCameraPermissionsAsync } from 'expo-image-picker';
// import TextRecognition from '@react-native-ml-kit/text-recognition';
// import { Button, colors, showPopup } from '../components/ui';

// interface Line { text: string; top: number; left: number }

// export default function OcrTestScreen() {
//   const [uri, setUri] = useState<string | null>(null);
//   const [fullText, setFullText] = useState('');
//   const [lines, setLines] = useState<Line[]>([]);
//   const [busy, setBusy] = useState(false);
//   const [ms, setMs] = useState<number | null>(null);

//   const run = async (fromCamera: boolean) => {
//     if (fromCamera) {
//       const perm = await requestCameraPermissionsAsync();
//       if (!perm.granted) return showPopup('Permission needed', 'Allow camera access.');
//     }
//     const photo = fromCamera
//       ? await launchCameraAsync({ quality: 0.8 })
//       : await launchImageLibraryAsync({ quality: 0.8 });   // test with saved plate photos too
//     if (photo.canceled) return;

//     const imageUri = photo.assets[0].uri;
//     setUri(imageUri);
//     setBusy(true);
//     try {
//       const start = Date.now();
//       const result = await TextRecognition.recognize(imageUri);
//       setMs(Date.now() - start);

//       setFullText(result.text);
//       const found = result.blocks.flatMap((b) =>
//         b.lines.map((l) => ({ text: l.text, top: l.frame?.top ?? 0, left: l.frame?.left ?? 0 })),
//       );
//       setLines(found);

//       console.log('OCR full text:\n', result.text);
//       console.log('OCR lines:', JSON.stringify(found, null, 2));
//     } catch (e) {
//       showPopup('Scan failed', String(e));
//     } finally {
//       setBusy(false);
//     }
//   };

//   if (Platform.OS === 'web') {
//     return <Text style={{ padding: 24 }}>OCR works only in the Android/iOS development build.</Text>;
//   }

//   return (
//     <ScrollView contentContainerStyle={styles.wrap}>
//       <Button title="Take photo" onPress={() => run(true)} loading={busy} />
//       <Button title="Pick from gallery" onPress={() => run(false)} disabled={busy} />

//       {uri && <Image source={{ uri }} style={styles.img} resizeMode="contain" />}
//       {ms !== null && <Text style={styles.meta}>Read in {ms} ms · {lines.length} lines</Text>}

//       {fullText ? (
//         <>
//           <Text style={styles.h}>Raw text</Text>
//           <Text selectable style={styles.box}>{fullText}</Text>

//           <Text style={styles.h}>Lines (top, left)</Text>
//           {lines.map((l, i) => (
//             <Text key={i} style={styles.line}>
//               {i + 1}. [{Math.round(l.top)}, {Math.round(l.left)}]  {l.text}
//             </Text>
//           ))}
//         </>
//       ) : null}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   wrap: { padding: 16, gap: 8, paddingBottom: 48 },
//   img: { width: '100%', height: 240, backgroundColor: '#000', borderRadius: 10, marginTop: 8 },
//   meta: { color: colors.muted, fontSize: 13 },
//   h: { fontSize: 16, fontWeight: '700', marginTop: 12, color: colors.text },
//   box: { backgroundColor: colors.card, padding: 12, borderRadius: 10, color: colors.text },
//   line: { fontSize: 14, color: colors.text, paddingVertical: 2 },
// });

import { useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { launchCameraAsync, launchImageLibraryAsync, requestCameraPermissionsAsync } from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { Button, colors, showPopup } from '../components/ui';

interface Line { text: string; top: number; left: number }

// Reads the scanned text and suggests Model and Specification.
// The patterns are forgiving because OCR often drops letters (e.g. "Model" -> "odel").
function parseNameplate(text: string) {
  // "odel" also matches, since the first letter is often lost
  const model = (text.match(/m?odel\s*[:\-]?\s*([A-Z0-9][A-Z0-9 \-\/]+)/i)?.[1] ?? '')
    .replace(/[|]/g, '')
    .trim();

  const range = text.match(/range\s*[:\-]?\s*([^\n]+)/i)?.[1]?.trim();
  const output = text.match(/(\d+\s*to\s*\d+\s*m?a)/i)?.[1]?.trim();

  const specification = [range && `Range: ${range}`, output && `Output: ${output}`]
    .filter(Boolean)
    .join(', ');

  return { model, specification };
}

export default function OcrTestScreen() {
  const [uri, setUri] = useState<string | null>(null);
  const [fullText, setFullText] = useState('');            // original scan, read-only
  const [description, setDescription] = useState('');      // editable, filled by the scan
  const [model, setModel] = useState('');                  // editable, suggested from the scan
  const [specification, setSpecification] = useState('');  // editable, suggested from the scan
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

    const imageUri = photo.assets[0].uri;
    setUri(imageUri);
    setBusy(true);
    try {
      const start = Date.now();
      const result = await TextRecognition.recognize(imageUri);
      setMs(Date.now() - start);

      // 1. Original scan, kept unchanged for comparison
      setFullText(result.text);

      // 2. Scanned text goes into the description by default (user can edit it)
      setDescription(result.text);

      // 3. Suggested fields (user can edit them too)
      const parsed = parseNameplate(result.text);
      setModel(parsed.model);
      setSpecification(parsed.specification);

      const found = result.blocks.flatMap((b) =>
        b.lines.map((l) => ({ text: l.text, top: l.frame?.top ?? 0, left: l.frame?.left ?? 0 })),
      );
      setLines(found);

      console.log('OCR full text:\n', result.text);
      console.log('OCR parsed:', parsed);
    } catch (e) {
      showPopup('Scan failed', String(e));
    } finally {
      setBusy(false);
    }
  };

  if (Platform.OS === 'web') {
    return <Text style={{ padding: 24 }}>OCR works only in the Android/iOS development build.</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Button title="Take photo" onPress={() => run(true)} loading={busy} />
      <Button title="Pick from gallery" onPress={() => run(false)} disabled={busy} />

      {uri && <Image source={{ uri }} style={styles.img} resizeMode="contain" />}
      {ms !== null && <Text style={styles.meta}>Read in {ms} ms · {lines.length} lines</Text>}

      <Text style={styles.h}>Description (editable)</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="Scanned text will appear here. You can also type."
        placeholderTextColor={colors.muted}
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.h}>Model (editable)</Text>
      <TextInput
        style={styles.input}
        value={model}
        onChangeText={setModel}
        placeholder="Model"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.h}>Specification (editable)</Text>
      <TextInput
        style={styles.input}
        value={specification}
        onChangeText={setSpecification}
        placeholder="e.g. Range: 0-5M, Output: 4 To 20 mA"
        placeholderTextColor={colors.muted}
      />

      {fullText ? (
        <>
          <Text style={styles.h}>Raw text (original scan)</Text>
          <Text selectable style={styles.box}>{fullText}</Text>

          <Text style={styles.h}>Lines (top, left)</Text>
          {lines.map((l, i) => (
            <Text key={i} style={styles.line}>
              {i + 1}. [{Math.round(l.top)}, {Math.round(l.left)}]  {l.text}
            </Text>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 8, paddingBottom: 48 },
  img: { width: '100%', height: 240, backgroundColor: '#000', borderRadius: 10, marginTop: 8 },
  meta: { color: colors.muted, fontSize: 13 },
  h: { fontSize: 16, fontWeight: '700', marginTop: 12, color: colors.text },
  input: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 10,
    color: colors.text,
    fontSize: 14,
  },
  multiline: { minHeight: 120 },
  box: { backgroundColor: colors.card, padding: 12, borderRadius: 10, color: colors.text },
  line: { fontSize: 14, color: colors.text, paddingVertical: 2 },
});