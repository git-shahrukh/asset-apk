import { ApiError, api } from './client';
import { Block, Field,FormValues,PickedFile, RecordItem, Session, User } from './types';
import axios from 'axios';
import { Platform } from 'react-native';
// The ids are sent as query parameters, e.g. /blocks/lists?client_id=...
const PATHS = {
  login: '/auth/login',
  blocks: '/blocks/lists', // ?client_id=<user's client id>  blocks of that client
  fields: '/fields/lists', // ?block_id=<block id>          fields of that block
  createRecord:(blockId:string)=>`/records/${blockId}/create`, //save record
  relationOptions:(blockId:string)=>`/records/${blockId}/relation_list`,
  users: '/users/lists', // ?client_id=<user's client id>  users of that client

};

// expiry_at = 60 → minutes. ADJUST to 1000 if your backend sends seconds.
const EXPIRY_UNIT_MS = 60_000;
// Files take longer to send than the normal 20 second timeout allows.
const UPLOAD_TIMEOUT_MS = 120_000;

// ---------- Raw API shapes (only the properties we read) ----------
interface RawUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  role: { name: string; slug: string } | null;
  client: { id: string } | null;
  permissions: unknown[] | null;
}

interface RawBlock {
  id: string;
  singular_name: string;
  plural_name: string;
  icon: string;
  status: string;
  sortOrder: number;
  show_in_sidebar: string; // "true" / "false" as a string
}

interface RawField {
  id: string;
  label: string;
  type: string;
  status: string;
  options: string[] | null;
  userType: string[] | null;
  hideFrom: string[] | null;
  set_as_title: boolean;
  isRequired: boolean;
  blockRelation: { relationBlock: { id: string; singular_name: string } }[] | null;
}

// ---------- Auth ----------
export async function login(username: string, password: string): Promise<Session> {
  // ADJUST: the body keys your backend expects (e.g. { email: username, password }).
  const { data } = await api.post(PATHS.login, { username, password });
  const d = data.data;

  const token: string | undefined = d.token ?? d.accessToken ?? d.access_token; // ADJUST: token key
  if (!token) throw new ApiError('Login response did not include a token');

  const raw: RawUser = d.userData;
  if (raw.status !== 'active') throw new ApiError('Your account is not active');

  return {
    token,
    refreshToken: d.refreshToken,
    user: toUser(raw),
    expiresAt: Date.now() + d.expiry_at * EXPIRY_UNIT_MS,
  };
}

function toUser(u: RawUser): User {
  return {
    id: u.id,
    name: `${u.first_name} ${u.last_name}`.trim(),
    email: u.email,
    roleName: u.role?.name ?? '',
    roleSlug: u.role?.slug ?? '',
    clientId: u.client?.id ?? null,
    permissions: u.permissions ?? [],
  };
}

// ---------- Blocks (only active + shown in sidebar, sorted) ----------
export async function getBlocks(clientId: string): Promise<Block[]> {
  const { data } = await api.get(PATHS.blocks, { params: { client_id: clientId } });
  return (data.blocks as RawBlock[])
    .filter((b) => b.status === 'active' && b.show_in_sidebar === 'true')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((b) => ({
      id: b.id,
      name: b.singular_name.trim(),
      pluralName: b.plural_name.trim(),
      icon: b.icon,
      sortOrder: b.sortOrder,
    }));
}

// ---------- Fields (only active) ----------
export async function getFields(blockId: string): Promise<Field[]> {
  const { data } = await api.get(PATHS.fields, { params: { block_id: blockId } });
  return (data.fields as RawField[]).filter((f) => f.status === 'active').map(toField);
}

function toField(f: RawField): Field {
  const related = f.blockRelation?.[0]?.relationBlock;
  return {
    id: f.id,
    label: f.label.trim(),
    type: f.type,
    required: f.isRequired,
    isTitle: f.set_as_title,
    options: f.options ?? [],
    relation: related ? { blockId: related.id, blockName: related.singular_name } : null,
    visibleTo: f.userType ?? [],
    hiddenFrom: f.hideFrom ?? [],
  };
}

// ---------- Records (used by relationship pickers) ----------
// Not connected yet: relationship pickers show "Couldn't load the … list" until the
// records API is shared. Then call it here and map rows to { id, values }.
// export async function getRecords(blockId: string): Promise<RecordItem[]> {
//   const { data } = await api.get(PATHS.relationOptions(blockId));
//   console.log('relation_list response:', JSON.stringify(data, null, 2));

//   const rows: any[] = data.records ?? data.data ?? data;
//   if (!Array.isArray(rows)) throw new ApiError('relation_list did not return an array');

//   return rows.map((r) => ({
//     id: String(r.id),
//     values: r.values ?? r.data ?? r,
//   }));
// }
export async function getRecords(blockId: string): Promise<RecordItem[]> {
  const { data } = await api.get(PATHS.relationOptions(blockId));

  const rows = data?.relation_records;
  if (!Array.isArray(rows)) throw new ApiError('relation_list did not return relation_records');

  return rows.map((r: { id: string; name?: string }) => ({
    id: String(r.id),
    values: { name: r.name ?? '' },
  }));
}

// A record's display name is the value of the field marked set_as_title.
export function recordTitle(record: RecordItem, fields: Field[]) {
  const titleField = fields.find((f) => f.isTitle);
  // const value = titleField ? record.values[titleField.id] : undefined;
  const value = (titleField ? record.values[titleField.id] : undefined) ?? record.values.name;
  return value ? String(value) : `#${record.id.slice(0, 8)}`;
}

function isPickedFile(value: unknown): value is PickedFile {
  return typeof value === 'object' && value !== null && 'uri' in value;
}

// A phone sends a file as { uri, name, type }. The browser needs the real File.
function toUploadPart(file: PickedFile) {
  return (file.file ?? { uri: file.uri, name: file.name, type: file.mimeType ?? 'application/octet-stream' }) as Blob;
}

// Empty fields reach here as '' or null. Only these are dropped, so a typed 0 is still sent.
function onlyFilled(values: FormValues): FormValues {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value != null && value !== ''));
}

// A browser file's uri can be megabytes of text, so the log shows only its name.
function logPayload(blockId: string, filled: FormValues) {
  const text = JSON.stringify(filled, (_key, value) => (isPickedFile(value) ? `file: ${value.name}` : value), 2);
  console.log(`POST ${PATHS.createRecord(blockId)} payload:`, text);
}

//save new records in block
export async function createRecord(blockId:string,values:FormValues):Promise<void>{
  const filled = onlyFilled(values);
  // __DEV__ is false in a release build, so user data never goes to the device log.
  if (__DEV__) logPayload(blockId, filled);

  if (!Object.values(filled).some(isPickedFile)) {
    const { data } = await api.post(PATHS.createRecord(blockId),filled);
    if (__DEV__) console.log('Backend response:', data);
    return;
  }

  // JSON can't carry a file, so a record with a file goes as multipart/form-data.
  const form = new FormData();
  for (const [id, value] of Object.entries(filled)) {
    if (isPickedFile(value)) form.append(id, toUploadPart(value));
    else form.append(id, String(value));
  }
  const { data } = await api.post(PATHS.createRecord(blockId), form, { timeout: UPLOAD_TIMEOUT_MS });
  if (__DEV__) console.log('Backend response:', data);
}

// ---------- Map location ----------
const GEOCODER_URL = 'https://nominatim.openstreetmap.org';

// Nominatim blocks a phone's default User-Agent, so the app names itself. Browsers send their own.
const GEOCODER_HEADERS =
  Platform.OS === 'web' ? undefined : { 'User-Agent': 'AssetManagement/1.0 (com.endureva.assetapp)' };

// Pin position → address. Uses plain axios, not `api`, so the login token never leaves your backend.
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const { data } = await axios.get(`${GEOCODER_URL}/reverse`, {
    params: { format: 'jsonv2', lat, lon: lng },
    headers: GEOCODER_HEADERS,
  });
  return data.display_name ?? null;
}

// Typed location → pin position.
export async function searchPlace(query: string): Promise<{ lat: number; lng: number } | null> {
  const { data } = await axios.get(`${GEOCODER_URL}/search`, {
    params: { format: 'jsonv2', limit: 1, q: query },
    headers: GEOCODER_HEADERS,
  });
  return data[0] ? { lat: Number(data[0].lat), lng: Number(data[0].lon) } : null;
}

export interface Option { label: string; value: string }

export async function getUsers(clientId: string): Promise<Option[]> {
  const { data } = await api.get(PATHS.users, { params: { client_id: clientId } });
  const rows = data?.users ?? data?.data ?? data?.records; // ADJUST: key that holds the array
  if (!Array.isArray(rows)) throw new ApiError('users/lists did not return an array');

  return rows.map((u: any) => ({
    label: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.name || u.email || `#${String(u.id).slice(0, 8)}`,
    value: String(u.id),
  }));
}