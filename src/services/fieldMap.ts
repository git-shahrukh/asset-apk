// export interface FieldDef {
//   key: string;
//   label: string;
//   aliases: string[];
// }

// export const FIELDS: FieldDef[] = [
//   { key: 'name',      label: 'Name',          aliases: ['asset name', 'name', 'item', 'equipment'] },
//   { key: 'assetTag',  label: 'Asset ID',      aliases: ['asset id', 'asset tag', 'asset no', 'tag no', 'tag'] },
//   { key: 'serialNo',  label: 'Serial No',     aliases: ['serial number', 'serial no', 'serial', 's/n', 'sl no', 'sr no'] },
//   { key: 'model',     label: 'Model',         aliases: ['model no', 'model number', 'model'] },
//   { key: 'make',      label: 'Make / Brand',  aliases: ['manufacturer', 'brand', 'make', 'mfg', 'mfd by'] },
// ];


// Words that mean the same thing on a plate. If a form field's label equals ANY word
// in a group, every word in that group becomes an alias for that field.
export const SYNONYM_GROUPS: string[][] = [
  ['asset id', 'assets id', 'asset tag', 'asset no', 'asset number', 'tag no', 'tag'],
  ['serial no', 'serial number', 'serial', 's/n', 'sl no', 'sr no'],
  ['model', 'model no', 'model number'],
  ['manufacturer name', 'manufacturer', 'make', 'make / brand', 'brand', 'mfg', 'mfr', 'mfd by'],
  // optional: remove this line if you don't want Range to fill Specification
  ['specification', 'specifications', 'spec', 'range'],
];

// lowercase, collapse spaces, drop trailing ":" "." so "Serial No." == "serial no"
export const norm = (s: string) =>
  s.toLowerCase().replace(/\s+/g, ' ').replace(/[:.\s]+$/, '').trim();

// "Asset Description", "Description", "Remarks", "Notes" all receive the leftover text
export const isDescription = (label: string) => /description|remark|note/.test(norm(label));

export const TEXT_TYPES: string[] = ['text'];