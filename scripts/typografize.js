const fs = require('node:fs');
const path = require('node:path');
const cheerio = require('cheerio');
const Typograf = require('typograf');

const inputArg = process.argv[2];

if (!inputArg) {
  console.error('Usage: node scripts/typografize.js <html-file>');
  process.exit(1);
}

const filePath = path.resolve(process.cwd(), inputArg);

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const html = fs.readFileSync(filePath, 'utf8');
const $ = cheerio.load(html, { decodeEntities: false });
const tp = new Typograf({ locale: ['ru', 'en-US'] });

tp.enableRule('common/nbsp/*');
tp.enableRule('ru/optalign/*');
tp.enableRule('ru/punctuation/quote');
tp.enableRule('ru/space/afterPunctuation');
tp.enableRule('ru/space/year');
tp.enableRule('ru/space/centuries');
tp.enableRule('ru/space/month');
tp.enableRule('ru/typo/quotation');
tp.enableRule('common/punctuation/hellip');
tp.enableRule('common/punctuation/mdash');
tp.disableRule('common/html/url');

function shouldSkipTextNode(node) {
  if (!node || node.type !== 'text') return true;
  if (!node.data || !node.data.trim()) return true;

  const parent = node.parent;
  if (!parent || !parent.name) return false;

  return ['script', 'style'].includes(parent.name);
}

function typografizeNode(node) {
  if (shouldSkipTextNode(node)) return;
  node.data = tp.execute(node.data);
}

$('*').contents().each((_, node) => {
  typografizeNode(node);
});

fs.writeFileSync(filePath, $.html(), 'utf8');
console.log(`Typografized: ${path.relative(process.cwd(), filePath)}`);
