// Generates responsive WebP variants and a dimension manifest for every site JPEG.
// Run after adding or replacing photos:  node build-images.js
// Output: assets/img/<name>[-480|-800].webp  +  data/img-dims.json
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = path.join(__dirname, 'assets', 'img');
const OUT = path.join(__dirname, 'data', 'img-dims.json');
const WIDTHS = [480, 800, 1200];

function probe(file) {
  const s = execFileSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file
  ], { encoding: 'utf8' }).trim();
  const parts = s.split(',').map(Number);
  return { w: parts[0], h: parts[1] };
}

function toWebp(src, dst, width) {
  execFileSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error', '-i', src,
    '-vf', "scale='min(" + width + ",iw)':-2:flags=lanczos",
    '-c:v', 'libwebp', '-quality', '78', '-preset', 'photo', '-an', dst
  ]);
}

const manifest = {};
const files = fs.readdirSync(DIR).filter(n => /\.jpe?g$/i.test(n)).sort();
for (const f of files) {
  const src = path.join(DIR, f);
  const dim = probe(src);
  const base = f.replace(/\.[^.]+$/, '');
  const widths = Array.from(new Set(WIDTHS.map(x => Math.min(x, dim.w)))).sort((a, b) => a - b);
  const variants = [];
  widths.forEach((tw, i) => {
    const isLargest = i === widths.length - 1;
    const out = isLargest ? base + '.webp' : base + '-' + tw + '.webp';
    toWebp(src, path.join(DIR, out), tw);
    variants.push({ w: tw, file: out });
  });
  manifest[f] = { w: dim.w, h: dim.h, variants };
  const total = variants.reduce((n, v) => n + fs.statSync(path.join(DIR, v.file)).size, 0);
  console.log(f.padEnd(34) + dim.w + 'x' + dim.h + '  ->  ' +
    variants.map(v => v.w + 'w').join(', ') + '  (' + Math.round(total / 1024) + 'KB webp)');
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2));
console.log('Wrote ' + OUT + ' (' + Object.keys(manifest).length + ' images)');
