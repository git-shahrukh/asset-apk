export interface User {
    id:string;
    name:string;
    email:string;
    roleName:string;
    roleSlug:string;
    clientId:string | null;
    permissions:unknown[];
}

export interface Session {
    token:string;
    refreshToken?:string;
    user:User;
    expiresAt:number;
}

export interface Block {
    id:string;
    name:string;
    pluralName:string;
    icon:string;
    sortOrder:number;
}
export type FieldType ='text' | 'number' | 'boolean' | 'date' | 'datetime' | 'time' | 'select' | 'multiselect' | 'file' | 'image' | 'video' | 'audio' | 'json' | 'object' | 'array'|'relationship'|(string & {})|'durations'|'user'|'location'|'currency'|'photo'|'attachment';

export interface Field{
    id: string;
  label: string;
  type: FieldType;
  required: boolean;
  isTitle: boolean;  // set_as_title: this field's value names the record
  options: string[]; // for "select"
  relation: { blockId: string; blockName: string } | null; // for "relationship"
  visibleTo: string[];  // userType: roles that can see it (empty = everyone)
  hiddenFrom: string[]; // hideFrom: roles that can't see it
}

export interface RecordItem {
    id:string;
    values:Record<string, unknown>;
}

// A file chosen in an attachment field. `file` only exists in the browser.
export interface PickedFile {
    uri:string;
    name:string;
    mimeType?:string;
    file?:File;
    latitude?: number | null;    // set for camera photos
  longitude?: number | null;
}

export type FormValues=Record<string, unknown>;

// The location chosen for a record. Latitude and longitude stay null until the pin is placed.
export interface Place {
    location:string;
    latitude:number | null;
    longitude:number | null;
}