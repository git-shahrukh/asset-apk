export interface FieldDef {
  key: string;
  label: string;
  aliases: string[];
}

export const FIELDS: FieldDef[] = [
  { key: 'name',      label: 'Name',          aliases: ['asset name', 'name', 'item', 'equipment'] },
  { key: 'assetTag',  label: 'Asset ID',      aliases: ['asset id', 'asset tag', 'asset no', 'tag no', 'tag'] },
  { key: 'serialNo',  label: 'Serial No',     aliases: ['serial number', 'serial no', 'serial', 's/n', 'sl no', 'sr no'] },
  { key: 'model',     label: 'Model',         aliases: ['model no', 'model number', 'model'] },
  { key: 'make',      label: 'Make / Brand',  aliases: ['manufacturer', 'brand', 'make', 'mfg', 'mfd by'] },
];