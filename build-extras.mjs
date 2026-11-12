// ساخت بسته‌های extras برای هر صفحه از src/extras.src.js
// اجرا:  node src/build-extras.mjs   (نیاز به esbuild)
// خروجی: extras.nevisandegi.js, extras.reader.js, extras.library.js, extras.works.js, extras.about.js
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const require = createRequire(process.env.ESBUILD_DIR ? process.env.ESBUILD_DIR + '/' : import.meta.url);
const esbuild = require('esbuild');

const lines = readFileSync(join(here, 'extras.src.js'), 'utf8').split('\n');
const idx = (re, from = 0) => { for (let i = from; i < lines.length; i++) if (re.test(lines[i])) return i; throw new Error('not found ' + re); };
const iifeStart = idx(/^\(function \(\) \{$/);
const iifeEnd = lines.length - 1 - [...lines].reverse().findIndex(l => /^\}\)\(\);\s*$/.test(l));
const aboutRet = idx(/^if \(isAbout\) return;/);
const flagsFrom = idx(/^var path = /), flagsTo = idx(/^if \(!\(isWriter/);
const strictLine = lines[iifeStart + 1];
const pageBody = (about) => {
  const body = [];
  for (let i = iifeStart + 2; i < iifeEnd; i++) {
    if (i >= flagsFrom && i <= flagsTo) continue;       // تشخیص صفحه از روی آدرس حذف می‌شود
    if (i === aboutRet) { if (about) break; else continue; }
    body.push(lines[i]);
  }
  return strictLine + '\n' + body.join('\n');
};

const pages = { nevisandegi: 'isWriter', reader: 'isReader', library: 'isLibrary', works: 'isWorks', about: 'isAbout' };
const header = '/* extras — بسته‌ی اختصاصی این صفحه؛ منبع: src/extras.src.js (ساخت با src/build-extras.mjs) */\n';
for (const [name, flag] of Object.entries(pages)) {
  const define = {};
  for (const f of Object.values(pages)) define[f] = String(f === flag);
  const src = pageBody(name === 'about');
  const r = esbuild.buildSync({
    stdin: { contents: src, loader: 'js', resolveDir: here },
    bundle: true, format: 'iife', minify: true, charset: 'utf8', define, write: false, treeShaking: true, target: 'es2017',
  });
  const out = header + r.outputFiles[0].text;
  writeFileSync(join(root, `extras.${name}.js`), out);
  console.log(name, (Buffer.byteLength(out) / 1024).toFixed(1) + ' KB');
}
