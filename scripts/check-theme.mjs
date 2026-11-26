import fs from 'node:fs';
import path from 'node:path';

const sourceRoot = path.resolve('src');
const themeRoot = path.resolve('src/theme');
const strict = process.argv.includes('--strict');
const extensions = new Set(['.ts', '.tsx']);
const rawColorPattern = /#[0-9a-fA-F]{3,8}\b|\b(?:red|blue|white|black|gray|grey)\b/g;
const styleDeclarationPattern = /\b(padding|paddingVertical|paddingHorizontal|margin|marginTop|marginBottom|gap|borderRadius|fontSize|lineHeight|height|minHeight|borderWidth):\s*([^,}\n]+)/g;

function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesIn(file);
    return extensions.has(path.extname(file)) ? [file] : [];
  });
}

function withoutComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
}

const sourceFiles = filesIn(sourceRoot).filter((file) => !file.startsWith(themeRoot));
const colorViolations = [];
const styleOccurrences = new Map();

for (const file of sourceFiles) {
  const lines = withoutComments(fs.readFileSync(file, 'utf8')).split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const match of line.matchAll(rawColorPattern)) {
      colorViolations.push(`${path.relative(process.cwd(), file)}:${index + 1} -> ${match[0]}`);
    }
    for (const match of line.matchAll(styleDeclarationPattern)) {
      const declaration = `${match[1]}: ${match[2].trim()}`;
      // Token references are intentional: they are the centralized design system.
      // Type declarations such as `height: number` are not visual styles.
      if (/\b(?:spacing|shape|componentTokens|typography|elevation|motion)\./.test(declaration) || /:\s*number;?$/.test(declaration)) continue;
      const occurrences = styleOccurrences.get(declaration) ?? [];
      occurrences.push(`${path.relative(process.cwd(), file)}:${index + 1}`);
      styleOccurrences.set(declaration, occurrences);
    }
  });
}

const duplicatedStyles = [...styleOccurrences.entries()]
  .filter(([, locations]) => new Set(locations.map((location) => location.split(':')[0])).size > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log(`Theme audit: ${sourceFiles.length} source files scanned.`);
console.log(`Unauthorized raw color literals: ${colorViolations.length}`);
if (colorViolations.length) colorViolations.forEach((item) => console.log(`  ${item}`));
console.log(`Repeated visual declarations across files: ${duplicatedStyles.length}`);
duplicatedStyles.slice(0, 20).forEach(([declaration, locations]) => {
  console.log(`  ${declaration} -> ${locations.join(', ')}`);
});

if (strict && colorViolations.length) {
  console.error('Theme audit failed: move raw UI colors into src/theme before using strict mode.');
  process.exitCode = 1;
}
