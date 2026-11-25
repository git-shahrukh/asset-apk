// import { Platform, StyleSheet, Text, View } from 'react-native';
// import { WebView } from 'react-native-webview';
// // import { reverseGeocode, searchPlace } from '../api/endpoints';
// import { Place } from '../api/types';
// import { Button, Input, colors } from '../components/ui';
// import type { FieldProps } from './fieldComponents';
// import { mapHtml } from './mapHtml';
// import { reverseGeocode, searchPlace, suggestPlaces, PlaceSuggestion } from '../api/endpoints';
// import { Pressable } from 'react-native';   // add Pressable to your existing react-native import

// interface Pin {
//   lat: number;
//   lng: number;
// }

// const EMPTY: Place = { location: '', latitude: null, longitude: null };
// const START = { lat: 20.5937, lng: 78.9629, zoom: 4 }; // ADJUST: where the map opens
// const FOUND_ZOOM = 16;

// //state for the search suggestions
// const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
// const typing = useRef(false);   // true only while the user is typing

// //Add Debounace search for the location input 



// // 6 decimals is about 10 cm, more than enough for placing an asset.
// const round = (value: number) => Number(value.toFixed(6));

// // WebView on a phone, iframe in the browser. Both show the same page.
// function MapFrame({ html, onPin }: { html: string; onPin: (pin: Pin) => void }) {
//   const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);

//   useEffect(() => {
//     if (!frame) return;
//     const listener = (event: MessageEvent) => {
//       if (event.source === frame.contentWindow) onPin(JSON.parse(event.data));
//     };
//     window.addEventListener('message', listener);
//     return () => window.removeEventListener('message', listener);
//   }, [frame, onPin]);

//   if (Platform.OS === 'web') {
//     return createElement('iframe', { ref: setFrame, srcDoc: html, style: { width: '100%', height: '100%', border: 0 } });
//   }

//   return (
//     <WebView
//       // baseUrl gives map image requests a Referer, which OpenStreetMap requires.
//       source={{ html, baseUrl: 'https://endureva.cloud' }}
//       originWhitelist={['*']}
//       nestedScrollEnabled // lets the map take the drag instead of the form's scroll
//       onMessage={(event) => onPin(JSON.parse(event.nativeEvent.data))}
//     />
//   );
// }


// // The backend's "location" field. Moving the pin fills in the location, latitude and longitude.
// export function LocationField({ value, onChange, onBlur, hasError, inputRef, onCoordinates }: FieldProps) {
//   const [place, setPlace] = useState<Place>(value || EMPTY);
//   // Only changing this reloads the map. It starts at the saved pin if the row was re-created.
//   const [center, setCenter] = useState(() =>
//     place.latitude !== null && place.longitude !== null
//       ? { lat: place.latitude, lng: place.longitude, zoom: FOUND_ZOOM }
//       : START,
//   );
//   const [searching, setSearching] = useState(false);
//   const [message, setMessage] = useState<string | null>(null);
//   const lastRequest = useRef(0);
//   const html = useMemo(() => mapHtml(center.lat, center.lng, center.zoom), [center]);

//   // Keeps the form's value the same as what this field shows.
//   useEffect(() => {
//     onChange(place);
//   }, [place, onChange]);

//   // Runs only when the user moves the pin, so reopening a row can't overwrite typed coordinates.
//   const moveTo = useCallback(({ lat, lng }: Pin) => {
//     setPlace((p) => ({ ...p, latitude: round(lat), longitude: round(lng) }));
//     onCoordinates?.(round(lat), round(lng));
//   }, [onCoordinates]);

//   const onPin = useCallback(async ({ lat, lng }: Pin) => {
//     const request = ++lastRequest.current;
//     setMessage(null);
//     moveTo({ lat, lng });
//     try {
//       const address = await reverseGeocode(lat, lng);
//       if (request !== lastRequest.current) return; // the pin has moved again since
//       if (address) setPlace((p) => ({ ...p, location: address }));
//       else setMessage('No address found here. You can type the location.');
//     } catch {
//       if (request === lastRequest.current) setMessage("Couldn't get the address. You can type the location.");
//     }
//   }, [moveTo]);

//   const findOnMap = async () => {
//     const request = ++lastRequest.current;
//     setMessage(null);
//     setSearching(true);
//     try {
//       const found = await searchPlace(place.location.trim());
//       if (request !== lastRequest.current) return;
//       if (!found) {
//         setMessage('Location not found. Drag the pin to the right place.');
//         return;
//       }
//       moveTo(found);
//       setCenter({ ...found, zoom: FOUND_ZOOM });
//     } catch {
//       setMessage("Couldn't search right now. Drag the pin to the right place.");
//     } finally {
//       setSearching(false);
//     }
//   };

  
//   return (
//     <View>
//       <Input
//         ref={inputRef}
//         value={place.location}
//         onChangeText={(location) => setPlace((p) => ({ ...p, location }))}
//         onBlur={onBlur}
//         placeholder="Type a location or move the pin"
//         hasError={hasError}
//       />
//       <Button title="Find on map" onPress={findOnMap} loading={searching} disabled={!place.location.trim()} />
//       {message ? <Text style={styles.message}>{message}</Text> : null}

//       <View style={styles.map}>
//         <MapFrame html={html} onPin={onPin} />
//       </View>

//       <View style={styles.row}>
//         <Text style={styles.coordinate}>{`Latitude: ${place.latitude ?? '—'}`}</Text>
//         <Text style={styles.coordinate}>{`Longitude: ${place.longitude ?? '—'}`}</Text>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   map: { height: 280, marginTop: 12, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
//   row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
//   coordinate: { fontSize: 14, color: colors.text },
//   message: { color: colors.danger, fontSize: 13, marginTop: 6 },
// });

import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Place } from '../api/types';
import { AnimatedPressable, Button, Input } from '../components/ui';
import { componentTokens, shape, spacing, typography, useTheme } from '../theme';
import type { FieldProps } from './fieldComponents';
import { mapHtml } from './mapHtml';
import { reverseGeocode, searchPlace, suggestPlaces, PlaceSuggestion } from '../api/endpoints';

interface Pin {
  lat: number;
  lng: number;
}

function parsePinMessage(raw: string): Pin | null {
  try {
    const value = JSON.parse(raw) as { lat?: unknown; lng?: unknown };
    if (
      typeof value.lat !== 'number' || typeof value.lng !== 'number' ||
      !Number.isFinite(value.lat) || !Number.isFinite(value.lng) ||
      value.lat < -90 || value.lat > 90 || value.lng < -180 || value.lng > 180
    ) return null;
    return { lat: value.lat, lng: value.lng };
  } catch {
    return null;
  }
}

const EMPTY: Place = { location: '', latitude: null, longitude: null };
const START = { lat: 20.5937, lng: 78.9629, zoom: 4 }; // ADJUST: where the map opens
const FOUND_ZOOM = 16;
const SUGGEST_MIN_CHARS = 3;   // start suggesting after this many characters
const SUGGEST_DELAY_MS = 400;  // wait this long after the last keystroke

// 6 decimals is about 10 cm, more than enough for placing an asset.
const round = (value: number) => Number(value.toFixed(6));

// WebView on a phone, iframe in the browser. Both show the same page.
function MapFrame({ html, onPin }: { html: string; onPin: (pin: Pin) => void }) {
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!frame) return;
    const listener = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow) return;
      const pin = parsePinMessage(event.data);
      if (pin) onPin(pin);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [frame, onPin]);

  if (Platform.OS === 'web') {
    return createElement('iframe', { ref: setFrame, srcDoc: html, style: { width: '100%', height: '100%', border: 0 } });
  }

  return (
    <WebView
      // baseUrl gives map image requests a Referer, which OpenStreetMap requires.
      source={{ html, baseUrl: 'https://endureva.cloud' }}
      originWhitelist={['*']}
      nestedScrollEnabled // lets the map take the drag instead of the form's scroll
       onMessage={(event) => {
         const pin = parsePinMessage(event.nativeEvent.data);
         if (pin) onPin(pin);
       }}
    />
  );
}

// The backend's "location" field. Moving the pin fills in the location, latitude and longitude.
export function LocationField({ value, onChange, onBlur, hasError, inputRef, onCoordinates }: FieldProps) {
  const { theme } = useTheme();
  const [place, setPlace] = useState<Place>(value || EMPTY);
  // Only changing this reloads the map. It starts at the saved pin if the row was re-created.
  const [center, setCenter] = useState(() =>
    place.latitude !== null && place.longitude !== null
      ? { lat: place.latitude, lng: place.longitude, zoom: FOUND_ZOOM }
      : START,
  );
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const lastRequest = useRef(0);
  const html = useMemo(() => mapHtml(center.lat, center.lng, center.zoom), [center]);

  // NEW: suggestions shown under the input
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  // NEW: true only while the user is typing. The text also changes when the pin moves or a
  // suggestion is picked, and those changes must not open the list again.
  const typing = useRef(false);

  // Keeps the form's value the same as what this field shows.
  useEffect(() => {
    onChange(place);
  }, [place, onChange]);

  // NEW: debounced search. Runs after every change of the text.
  useEffect(() => {
    const query = place.location.trim();
    if (!typing.current || query.length < SUGGEST_MIN_CHARS) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setSuggestions(await suggestPlaces(query, controller.signal));
      } catch {
        if (!controller.signal.aborted) setSuggestions([]); // fail quietly, typing still works
      }
    }, SUGGEST_DELAY_MS);
    return () => {          // runs on the next keystroke
      clearTimeout(timer);  // cancels the waiting search
      controller.abort();   // cancels a search already sent
    };
  }, [place.location]);

  // Runs only when the user moves the pin, so reopening a row can't overwrite typed coordinates.
  const moveTo = useCallback(({ lat, lng }: Pin) => {
    setPlace((p) => ({ ...p, latitude: round(lat), longitude: round(lng) }));
    onCoordinates?.(round(lat), round(lng));
  }, [onCoordinates]);

  const onPin = useCallback(async ({ lat, lng }: Pin) => {
    typing.current = false;   // NEW: the address is about to change, don't suggest
    setSuggestions([]);       // NEW
    const request = ++lastRequest.current;
    setMessage(null);
    moveTo({ lat, lng });
    try {
      const address = await reverseGeocode(lat, lng);
      if (request !== lastRequest.current) return; // the pin has moved again since
      if (address) setPlace((p) => ({ ...p, location: address }));
      else setMessage('No address found here. You can type the location.');
    } catch {
      if (request === lastRequest.current) setMessage("Couldn't get the address. You can type the location.");
    }
  }, [moveTo]);

  // NEW: the user tapped a suggestion
  const pickSuggestion = (s: PlaceSuggestion) => {
    typing.current = false;
    lastRequest.current++;   // ignore any reverse-geocode still in flight
    setSuggestions([]);
    setMessage(null);
    setPlace({ location: s.label, latitude: round(s.lat), longitude: round(s.lng) });
    onCoordinates?.(round(s.lat), round(s.lng));
    setCenter({ lat: s.lat, lng: s.lng, zoom: FOUND_ZOOM }); // moves the map and pin
  };

  const findOnMap = async () => {
    typing.current = false;   // NEW
    setSuggestions([]);       // NEW
    const request = ++lastRequest.current;
    setMessage(null);
    setSearching(true);
    try {
      const found = await searchPlace(place.location.trim());
      if (request !== lastRequest.current) return;
      if (!found) {
        setMessage('Location not found. Drag the pin to the right place.');
        return;
      }
      moveTo(found);
      setCenter({ ...found, zoom: FOUND_ZOOM });
    } catch {
      setMessage("Couldn't search right now. Drag the pin to the right place.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <View>
      <Input
        ref={inputRef}
        value={place.location}
        onChangeText={(location) => {
          typing.current = true;   // NEW: the user is typing
          setPlace((p) => ({ ...p, location }));
        }}
        onBlur={onBlur}
        placeholder="Type a location or move the pin"
        hasError={hasError}
      />

      {/* NEW: suggestion list */}
      {suggestions.length > 0 && (
        <View style={[styles.suggestions, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
          {suggestions.map((s, i) => (
            <AnimatedPressable key={`${s.lat}-${s.lng}-${i}`} onPress={() => pickSuggestion(s)} style={[styles.suggestion, { borderBottomColor: theme.colors.outline }]}>
              <Text style={[styles.suggestionText, { color: theme.colors.textPrimary }]} numberOfLines={2}>{s.label}</Text>
            </AnimatedPressable>
          ))}
        </View>
      )}

      <Button title="Find on map" onPress={findOnMap} loading={searching} disabled={!place.location.trim()} />
      {message ? <Text style={[styles.message, { color: theme.colors.error }]}>{message}</Text> : null}

      <View style={[styles.map, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
        <MapFrame html={html} onPin={onPin} />
      </View>

      <View style={styles.row}>
        <Text style={[styles.coordinate, { color: theme.colors.textSecondary }]}>{`Latitude: ${place.latitude ?? '—'}`}</Text>
        <Text style={[styles.coordinate, { color: theme.colors.textSecondary }]}>{`Longitude: ${place.longitude ?? '—'}`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { height: componentTokens.location.mapHeight, marginTop: spacing.md, borderRadius: shape.medium, overflow: 'hidden', borderWidth: componentTokens.card.borderWidth },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, gap: spacing.sm },
  coordinate: { ...typography.bodySmall, flex: 1 },
  message: { ...typography.bodySmall, marginTop: spacing.sm },
  suggestions: { marginTop: spacing.xs, borderWidth: componentTokens.card.borderWidth, borderRadius: shape.medium, overflow: 'hidden' },
  suggestion: { paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  suggestionText: { ...typography.bodySmall },
});
