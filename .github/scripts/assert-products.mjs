import { readFileSync } from 'node:fs';

const [, , file] = process.argv;

let items;
try {
  items = JSON.parse(readFileSync(file, 'utf8')).items;
} catch (error) {
  console.error(`products payload is not valid json: ${error.message}`);
  process.exit(1);
}

if (!Array.isArray(items) || items.length === 0) {
  console.error(`products endpoint returned no items: ${JSON.stringify(items)}`);
  process.exit(1);
}

console.log(`served ${items.length} products`);
