const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIAGRAMS_FILE = path.join(__dirname, '..', 'diagrams.drawio');
const OUTPUT_DIR = path.join(__dirname, '..', 'static', 'img', 'diagrams');

if (!fs.existsSync(DIAGRAMS_FILE)) {
  console.log('No diagrams.drawio file found');
  process.exit(0);
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function getPageNames(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const regex = /<diagram[^>]+name="([^"]+)"/g;
  const names = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    names.push(match[1]);
  }
  return names;
}

function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const pageNames = getPageNames(DIAGRAMS_FILE);

if (pageNames.length === 0) {
  console.error('No pages found in diagrams.drawio');
  process.exit(1);
}

const errors = [];

for (let i = 0; i < pageNames.length; i++) {
  const outputName = `${sanitizeFilename(pageNames[i])}.svg`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    execSync(`drawio -x -f svg -p ${i + 1} -b 15 --crop --svg-theme light -o "${outputPath}" "${DIAGRAMS_FILE}"`, {
      stdio: 'pipe',
    });
    console.log(`✓ ${outputName}`);
  } catch (err) {
    console.error(`✗ ${pageNames[i]}: ${err.message}`);
    errors.push(pageNames[i]);
  }
}

console.log('');
if (errors.length > 0) {
  console.error(`Failed: ${errors.join(', ')}`);
  process.exit(1);
} else {
  console.log(`Exported ${pageNames.length} page(s) to static/img/diagrams/`);
}
