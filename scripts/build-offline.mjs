import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const IMAGES_DIR = path.join(ROOT, 'src/assets/images');

function hasImageMagick() {
  try {
    execFileSync('convert', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function encodeImageToDataUrl(filePath, useConvert, tempDir) {
  let buffer;
  if (useConvert) {
    const outFile = path.join(tempDir, path.basename(filePath));
    try {
      execFileSync(
        'convert',
        [
          filePath,
          '-resize',
          '640x>',
          '-strip',
          '-sampling-factor',
          '4:2:0',
          '-quality',
          '76',
          outFile,
        ],
        { stdio: 'ignore' }
      );
      buffer = fs.readFileSync(outFile);
    } catch {
      buffer = fs.readFileSync(filePath);
    }
  } else {
    buffer = fs.readFileSync(filePath);
  }
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

async function buildOfflineHtml() {
  const distIndexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(distIndexPath)) {
    throw new Error('dist/index.html not found. Run "vite build" first.');
  }

  const distHtml = fs.readFileSync(distIndexPath, 'utf8');

  // Locate compiled CSS and JS entry assets from dist/index.html
  const cssMatches = [...distHtml.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css)"[^>]*>/g)];
  const jsMatch = distHtml.match(/<script[^>]+type="module"[^>]+src="([^"]+\.js)"[^>]*><\/script>/);

  if (!jsMatch) {
    throw new Error('Could not find compiled module script in dist/index.html');
  }

  const jsRelPath = jsMatch[1].replace(/^\//, '');
  const jsEntryPath = path.join(DIST_DIR, jsRelPath);

  let combinedCss = '';
  for (const m of cssMatches) {
    const cssRel = m[1].replace(/^\//, '');
    const cssPath = path.join(DIST_DIR, cssRel);
    if (fs.existsSync(cssPath)) {
      combinedCss += `${fs.readFileSync(cssPath, 'utf8')}\n`;
    }
  }

  // Convert the Vite ESM bundle into a classic self-contained IIFE so it runs cleanly over file:// without CORS errors
  const iifeResult = await esbuild.build({
    entryPoints: [jsEntryPath],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    minify: true,
    write: false,
  });

  let bundleCode = iifeResult.outputFiles[0].text;

  // Inline all referenced studio editorial images as optimized base64 data URLs
  const useConvert = hasImageMagick();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'magdana-offline-'));
  let inlinedCount = 0;

  try {
    const imageFiles = fs
      .readdirSync(IMAGES_DIR)
      .filter((name) => /\.(jpg|jpeg|png|webp)$/i.test(name));

    for (const fileName of imageFiles) {
      const assetPath = `/src/assets/images/${fileName}`;
      if (!bundleCode.includes(assetPath)) continue;
      const absImagePath = path.join(IMAGES_DIR, fileName);
      const dataUrl = encodeImageToDataUrl(absImagePath, useConvert, tempDir);
      bundleCode = bundleCode.split(assetPath).join(dataUrl);
      inlinedCount += 1;
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  // Escape closing script tags safely inside inline script
  const safeJs = bundleCode.replace(/<\/script/gi, '<\\/script');
  const safeCss = combinedCss.replace(/<\/style/gi, '<\\/style');

  const iconSvgPath = path.join(ROOT, 'public/icon.svg');
  const faviconHref = fs.existsSync(iconSvgPath)
    ? `data:image/svg+xml;base64,${fs.readFileSync(iconSvgPath).toString('base64')}`
    : '';

  const offlineHtml = `<!doctype html>
<html lang="ru" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#141211" />
    <title>MAGDANA — Студия колористики и стиля (Оффлайн-версия)</title>
    <meta
      name="description"
      content="Автономная оффлайн-версия сайта студии MAGDANA: каталог из 83 услуг, портфолио работ и контакты для записи."
    />
    ${faviconHref ? `<link rel="icon" type="image/svg+xml" href="${faviconHref}" />` : ''}
    <style>${safeCss}</style>
    <script>window.__MAGDANA_OFFLINE__ = true;</script>
  </head>
  <body class="bg-[#141211] text-[#F5F0EB] antialiased selection:bg-[#D9A773]/30 selection:text-[#F5F0EB]">
    <div id="root"></div>
    <script>${safeJs}</script>
  </body>
</html>
`;

  const publicTarget = path.join(ROOT, 'public', 'magdana-offline.html');
  const distTarget = path.join(DIST_DIR, 'magdana-offline.html');

  fs.writeFileSync(publicTarget, offlineHtml, 'utf8');
  fs.writeFileSync(distTarget, offlineHtml, 'utf8');

  const sizeMb = (Buffer.byteLength(offlineHtml, 'utf8') / (1024 * 1024)).toFixed(2);
  console.log(
    `Built standalone offline HTML (${sizeMb} MB, ${inlinedCount} embedded studio images) -> public/magdana-offline.html & dist/magdana-offline.html`
  );
}

buildOfflineHtml().catch((err) => {
  console.error('Offline HTML build failed:', err);
  process.exit(1);
});
