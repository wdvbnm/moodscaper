// MoodScaper Icon & Splash Generator
// Generates all required PNG assets using sharp (SVG → PNG)
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, 'assets');

// ── Color Palette ──
const C = {
  sky1: '#5B9BD5',
  sky2: '#6C5CE7',
  warm1: '#FF6B6B',
  warm2: '#F9A66C',
  sun: '#FFD93D',
  sunInner: '#FFFBE6',
  cloudTop: '#ffffff',
  cloudBot: '#f0f4ff',
  sparkle: '#FFFFFF',
  bgLight: '#E6F4FE',
  splashBg1: '#667eea',
  splashBg2: '#f5a3c7',
  borderWhite: 'rgba(255,255,255,0.18)',
};

// ── SVG Templates ──

/** App Icon (1024x1024) — rounded square with gradient, cloud + sun + sparkles */
function svgAppIcon() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.sky1}"/>
      <stop offset="50%" stop-color="${C.sky2}"/>
      <stop offset="100%" stop-color="${C.warm1}"/>
    </linearGradient>
    <linearGradient id="cloudGrad" x1="0.25" y1="0.35" x2="0.75" y2="0.65">
      <stop offset="0%" stop-color="rgba(255,255,255,0.92)"/>
      <stop offset="50%" stop-color="rgba(255,255,255,0.80)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.60)"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.38" cy="0.35" r="0.42">
      <stop offset="0%" stop-color="rgba(255,255,255,0.28)"/>
      <stop offset="60%" stop-color="rgba(255,255,255,0.06)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.05)"/>
    </radialGradient>
    <radialGradient id="sunGrad" cx="0.4" cy="0.35" r="0.55">
      <stop offset="0%" stop-color="${C.sunInner}"/>
      <stop offset="40%" stop-color="${C.sun}"/>
      <stop offset="100%" stop-color="${C.warm2}"/>
    </radialGradient>
    <filter id="cloudShadow" x="-10%" y="-10%" width="130%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="28" flood-color="rgba(0,0,0,0.12)"/>
    </filter>
    <clipPath id="roundRect">
      <rect x="0" y="0" width="1024" height="1024" rx="225" ry="225"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <g clip-path="url(#roundRect)">
    <rect x="0" y="0" width="1024" height="1024" fill="url(#bgGrad)"/>
    <rect x="0" y="0" width="1024" height="1024" fill="url(#glow)"/>

    <!-- Cloud shape -->
    <g filter="url(#cloudShadow)">
      <path d="M 372 450
               C 372 450, 230 440, 230 460
               C 200 440, 150 470, 170 500
               C 130 510, 130 560, 170 570
               C 150 620, 210 650, 250 640
               C 270 690, 380 700, 410 670
               C 440 700, 570 690, 590 660
               C 620 690, 720 670, 730 630
               C 770 630, 810 580, 780 550
               C 800 520, 770 470, 730 470
               C 740 440, 700 410, 660 420
               C 640 390, 560 380, 530 400
               C 490 380, 410 390, 372 430 Z"
            fill="url(#cloudGrad)"/>
    </g>

    <!-- Sun -->
    <g transform="translate(490, 420)">
      <!-- rays -->
      ${sunRays(14, 165, 115)}
      <!-- circle -->
      <circle cx="0" cy="0" r="105" fill="url(#sunGrad)"/>
    </g>

    <!-- Sparkles -->
    ${sparkleSvg(310, 290, 32)}
    ${sparkleSvg(720, 580, 22, 0.85)}
    ${sparkleSvg(400, 620, 18, 0.9)}
  </g>

  <!-- Border -->
  <rect x="0" y="0" width="1024" height="1024" rx="225" ry="225"
        fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="8"/>
</svg>`;
}

/** Splash Icon (1024x1024) — transparent bg, centered cloud+sun for splash screen */
function svgSplashIcon() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="cloudGrad" x1="0.25" y1="0.35" x2="0.75" y2="0.65">
      <stop offset="0%" stop-color="rgba(255,255,255,0.95)"/>
      <stop offset="50%" stop-color="rgba(255,255,255,0.82)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.55)"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.52">
      <stop offset="0%" stop-color="rgba(255,255,255,0.55)"/>
      <stop offset="50%" stop-color="rgba(200,210,255,0.2)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
    <radialGradient id="sunGrad" cx="0.4" cy="0.35" r="0.55">
      <stop offset="0%" stop-color="${C.sunInner}"/>
      <stop offset="40%" stop-color="${C.sun}"/>
      <stop offset="100%" stop-color="${C.warm2}"/>
    </radialGradient>
    <filter id="cloudShadow" x="-10%" y="-10%" width="130%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="22" flood-color="rgba(0,0,0,0.1)"/>
    </filter>
  </defs>

  <!-- Glow -->
  <circle cx="512" cy="430" r="530" fill="url(#glow)"/>

  <!-- Cloud -->
  <g filter="url(#cloudShadow)">
    <path d="M 352 430
             C 352 430, 210 420, 210 440
             C 180 420, 130 450, 150 480
             C 110 490, 110 540, 150 550
             C 130 600, 190 630, 230 620
             C 250 670, 360 680, 390 650
             C 420 680, 550 670, 570 640
             C 600 670, 700 650, 710 610
             C 750 610, 790 560, 760 530
             C 780 500, 750 450, 710 450
             C 720 420, 680 390, 640 400
             C 620 370, 540 360, 510 380
             C 470 360, 390 370, 352 410 Z"
          fill="url(#cloudGrad)"/>
  </g>

  <!-- Sun -->
  <g transform="translate(480, 405)">
    ${sunRays(16, 175, 125)}
    <circle cx="0" cy="0" r="115" fill="url(#sunGrad)"/>
  </g>

  <!-- Sparkles -->
  ${sparkleSvg(330, 260, 36)}
  ${sparkleSvg(740, 560, 26, 0.88)}
  ${sparkleSvg(370, 650, 20, 0.9)}
</svg>`;
}

/** Android Adaptive Foreground (1024x1024) — with safe zone padding */
function svgAdaptiveForeground() {
  // Same as splash but positioned for adaptive icon safe zone (inner 66%)
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="cloudGrad" x1="0.25" y1="0.35" x2="0.75" y2="0.65">
      <stop offset="0%" stop-color="rgba(255,255,255,0.95)"/>
      <stop offset="50%" stop-color="rgba(255,255,255,0.82)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.58)"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.5">
      <stop offset="0%" stop-color="rgba(255,255,255,0.5)"/>
      <stop offset="50%" stop-color="rgba(200,210,255,0.18)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
    <radialGradient id="sunGrad" cx="0.4" cy="0.35" r="0.55">
      <stop offset="0%" stop-color="${C.sunInner}"/>
      <stop offset="40%" stop-color="${C.sun}"/>
      <stop offset="100%" stop-color="${C.warm2}"/>
    </radialGradient>
  </defs>

  <!-- Glow -->
  <circle cx="512" cy="430" r="540" fill="url(#glow)"/>

  <!-- Cloud (85% scale for safe zone) -->
  <path d="M 384 448
           C 384 448, 274 440, 274 455
           C 251 440, 211 463, 229 488
           C 195 496, 195 538, 229 546
           C 213 589, 264 614, 295 605
           C 311 649, 397 657, 422 632
           C 447 657, 560 649, 576 624
           C 600 649, 679 632, 687 599
           C 719 599, 750 557, 728 532
           C 745 507, 720 465, 687 465
           C 695 440, 663 414, 631 422
           C 614 397, 545 389, 521 406
           C 490 389, 421 397, 397 427 Z"
        fill="url(#cloudGrad)"/>

  <!-- Sun -->
  <g transform="translate(490, 418)">
    ${sunRays(16, 170, 120)}
    <circle cx="0" cy="0" r="110" fill="url(#sunGrad)"/>
  </g>

  <!-- Sparkles -->
  ${sparkleSvg(355, 290, 34)}
  ${sparkleSvg(730, 555, 26)}
  ${sparkleSvg(375, 635, 20)}
</svg>`;
}

/** Android Adaptive Background (1024x1024) — simple gradient bg */
function svgAdaptiveBg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="bgRadial" cx="0.5" cy="0.5" r="0.7">
      <stop offset="0%" stop-color="rgba(255,255,255,0.25)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.03)"/>
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="1024" height="1024" fill="${C.bgLight}"/>
  <rect x="0" y="0" width="1024" height="1024" fill="url(#bgRadial)"/>
</svg>`;
}

/** Monochrome Adaptive Icon (1024x1024) — white silhouette */
function svgMonochrome() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <clipPath id="safeZone">
      <circle cx="512" cy="512" r="512"/>
    </clipPath>
  </defs>
  <g clip-path="url(#safeZone)">
    <path d="M 352 440
             C 352 440, 210 430, 210 450
             C 180 430, 130 460, 150 490
             C 110 500, 110 550, 150 560
             C 130 610, 190 640, 230 630
             C 250 680, 360 690, 390 660
             C 420 690, 550 680, 570 650
             C 600 680, 700 660, 710 620
             C 750 620, 790 570, 760 540
             C 780 510, 750 460, 710 460
             C 720 430, 680 400, 640 410
             C 620 380, 540 370, 510 390
             C 470 370, 390 380, 352 420 Z"
          fill="white"/>
    <!-- Sun merged -->
    <circle cx="488" cy="425" r="122" fill="white"/>
    ${sunRaysRaw(488, 425, 180, 125, 14, 'white')}
    <!-- Sparkle dots -->
    <circle cx="310" cy="300" r="42" fill="white"/>
    <circle cx="740" cy="570" r="30" fill="white"/>
    <circle cx="390" cy="650" r="24" fill="white"/>
  </g>
</svg>`;
}

/** Favicon (96x96) — simplified */
function svgFavicon() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.sky1}"/>
      <stop offset="50%" stop-color="${C.sky2}"/>
      <stop offset="100%" stop-color="${C.warm1}"/>
    </linearGradient>
    <clipPath id="roundRect">
      <rect x="0" y="0" width="96" height="96" rx="17" ry="17"/>
    </clipPath>
  </defs>

  <g clip-path="url(#roundRect)">
    <rect x="0" y="0" width="96" height="96" fill="url(#bgGrad)"/>

    <!-- Simplified cloud -->
    <g fill="rgba(255,255,255,0.9)">
      <circle cx="30" cy="48" r="14"/>
      <circle cx="38" cy="38" r="20"/>
      <circle cx="52" cy="42" r="16"/>
      <circle cx="64" cy="48" r="11"/>
    </g>

    <!-- Simple sun -->
    <circle cx="38" cy="44" r="9" fill="${C.sun}"/>
  </g>
</svg>`;
}

// ── SVG helpers ──
function sunRays(count, outerR, innerR) {
  return sunRaysRaw(0, 0, outerR, innerR, count, 'rgba(255,217,61,0.27)');
}

function sunRaysRaw(cx, cy, outerR, innerR, count, fill) {
  let d = '';
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const x1 = Math.cos(angle) * innerR;
    const y1 = Math.sin(angle) * innerR;
    const x2 = Math.cos(angle) * outerR;
    const y2 = Math.sin(angle) * outerR;
    const xm = Math.cos(angle + 0.06) * outerR * 0.98;
    const ym = Math.sin(angle + 0.06) * outerR * 0.98;
    d += i === 0
      ? `M ${cx + x1} ${cy + y1} L ${cx + x2} ${cy + y2} L ${cx + xm} ${cy + ym}`
      : ` L ${cx + x1} ${cy + y1} L ${cx + x2} ${cy + y2} L ${cx + xm} ${cy + ym}`;
  }
  return `<path d="${d} Z" fill="${fill}"/>`;
}

function sparkleSvg(cx, cy, size, opacity = 1) {
  let d = '';
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? size : size * 0.35;
    const angle = (i * Math.PI) / 4 - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    d += i === 0 ? `M ${cx + x} ${cy + y}` : ` L ${cx + x} ${cy + y}`;
  }
  return `<path d="${d} Z" fill="white" opacity="${opacity}"/>`;
}

// ── Generate all icons ──
async function generate() {
  const icons = [
    { name: 'icon.png', svg: svgAppIcon(), size: 1024 },
    { name: 'splash-icon.png', svg: svgSplashIcon(), size: 1024 },
    { name: 'android-icon-foreground.png', svg: svgAdaptiveForeground(), size: 1024 },
    { name: 'android-icon-background.png', svg: svgAdaptiveBg(), size: 1024 },
    { name: 'android-icon-monochrome.png', svg: svgMonochrome(), size: 1024 },
    { name: 'favicon.png', svg: svgFavicon(), size: 96 },
  ];

  for (const icon of icons) {
    const filePath = path.join(ASSETS_DIR, icon.name);
    try {
      await sharp(Buffer.from(icon.svg))
        .resize(icon.size, icon.size)
        .png()
        .toFile(filePath);
      const stats = fs.statSync(filePath);
      console.log(`✅ ${icon.name} (${icon.size}×${icon.size}) — ${(stats.size / 1024).toFixed(1)} KB`);
    } catch (err) {
      console.error(`❌ Failed to generate ${icon.name}:`, err.message);
    }
  }

  console.log('\n🎉 所有图标已生成到 assets/ 目录！');
}

generate().catch(err => {
  console.error('生成失败:', err);
  process.exit(1);
});
