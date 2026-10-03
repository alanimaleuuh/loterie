/**
 * Génère les visuels de démonstration des lots (SVG originaux, sans dépendance externe).
 * Usage : npx tsx scripts/generate-illustrations.ts
 * Chaque lot dispose de 3 vues : studio, ambiance, détail.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

type Art = { slug: string; draw: (p: string) => string; detail: string; tint: [string, string]; mood: [string, string] };

const lg = (id: string, stops: [string, string][], x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops
    .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
    .join("")}</linearGradient>`;

const shadow = (cx: number, cy: number, rx: number, ry: number, o = 0.28) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#0b1220" opacity="${o}" filter="url(#blur)"/>`;

const arts: Art[] = [
  {
    slug: "tv-4k",
    tint: ["#eef1f6", "#dfe5ee"],
    mood: ["#1c2433", "#0d121c"],
    detail: "120 90 420 315",
    draw: (p) => `
      <defs>
        ${lg(p + "scr", [["0", "#1e3a5f"], ["0.45", "#3b6e8f"], ["0.7", "#e8a87c"], ["1", "#2b2d42"]])}
        ${lg(p + "frame", [["0", "#2a2f38"], ["1", "#0f1217"]])}
        ${lg(p + "hill", [["0", "#16324a"], ["1", "#0c1b2a"]])}
      </defs>
      ${shadow(400, 478, 250, 14)}
      <rect x="140" y="112" width="520" height="312" rx="10" fill="url(#${p}frame)"/>
      <rect x="148" y="120" width="504" height="290" rx="4" fill="url(#${p}scr)"/>
      <circle cx="520" cy="215" r="36" fill="#ffd8a8" opacity=".9"/>
      <path d="M148 330 C230 280 300 300 360 318 C430 340 500 270 652 300 V410 H148Z" fill="url(#${p}hill)" opacity=".95"/>
      <path d="M148 360 C260 330 360 370 460 350 C540 335 600 345 652 352 V410 H148Z" fill="#0a1420"/>
      <path d="M148 120 L330 120 L200 410 L148 410Z" fill="#fff" opacity=".05"/>
      <rect x="380" y="424" width="40" height="34" fill="#1a1e25"/>
      <rect x="300" y="456" width="200" height="12" rx="6" fill="#23272f"/>
      <rect x="392" y="414" width="16" height="3" rx="1.5" fill="#5eead4" opacity=".8"/>`,
  },
  {
    slug: "iphone",
    tint: ["#f3eee8", "#e7ded3"],
    mood: ["#2b2420", "#120e0c"],
    detail: "330 60 300 225",
    draw: (p) => `
      <defs>
        ${lg(p + "ti", [["0", "#c9bfb2"], ["0.5", "#a89c8d"], ["1", "#8a7f72"]], 1, 1)}
        ${lg(p + "wall", [["0", "#f6d365"], ["0.5", "#fda085"], ["1", "#6a4c93"]], 1, 1)}
        ${lg(p + "back", [["0", "#d8cfc4"], ["1", "#b4a898"]], 1, 1)}
      </defs>
      ${shadow(400, 500, 210, 12)}
      <g transform="rotate(-8 330 300)">
        <rect x="200" y="96" width="200" height="404" rx="40" fill="url(#${p}ti)"/>
        <rect x="208" y="104" width="184" height="388" rx="33" fill="#0b0b0d"/>
        <rect x="214" y="110" width="172" height="376" rx="28" fill="url(#${p}wall)"/>
        <rect x="270" y="122" width="60" height="18" rx="9" fill="#0b0b0d"/>
        <text x="300" y="215" font-family="Helvetica, Arial" font-size="52" font-weight="300" fill="#fff" text-anchor="middle" opacity=".95">09:41</text>
        <rect x="262" y="466" width="76" height="5" rx="2.5" fill="#fff" opacity=".7"/>
      </g>
      <g transform="rotate(7 520 300)">
        <rect x="430" y="110" width="196" height="396" rx="40" fill="url(#${p}back)"/>
        <rect x="446" y="126" width="98" height="104" rx="26" fill="#9c9183" opacity=".55"/>
        <circle cx="474" cy="154" r="20" fill="#1a1a1c"/><circle cx="474" cy="154" r="11" fill="#2d3748"/>
        <circle cx="474" cy="202" r="20" fill="#1a1a1c"/><circle cx="474" cy="202" r="11" fill="#2d3748"/>
        <circle cx="518" cy="178" r="20" fill="#1a1a1c"/><circle cx="518" cy="178" r="11" fill="#2d3748"/>
        <circle cx="520" cy="146" r="6" fill="#f5f0e6"/>
        <circle cx="528" cy="330" r="22" fill="none" stroke="#a69a8b" stroke-width="3"/>
      </g>`,
  },
  {
    slug: "macbook",
    tint: ["#eceff3", "#dde2e9"],
    mood: ["#1b2230", "#0b0f17"],
    detail: "150 70 400 300",
    draw: (p) => `
      <defs>
        ${lg(p + "scr", [["0", "#0f2027"], ["0.5", "#203a43"], ["1", "#2c5364"]], 1, 1)}
        ${lg(p + "alu", [["0", "#e3e6ea"], ["1", "#aeb4bc"]])}
        ${lg(p + "glow", [["0", "#7f5af0"], ["1", "#2cb67d"]], 1, 1)}
      </defs>
      ${shadow(400, 470, 300, 12)}
      <rect x="170" y="110" width="460" height="300" rx="14" fill="#16181d"/>
      <rect x="182" y="122" width="436" height="276" rx="4" fill="url(#${p}scr)"/>
      <path d="M182 300 C280 220 360 340 460 250 C530 190 580 230 618 210 V398 H182Z" fill="url(#${p}glow)" opacity=".55"/>
      <path d="M182 340 C290 290 380 380 480 320 C540 285 590 300 618 290 V398 H182Z" fill="url(#${p}glow)" opacity=".35"/>
      <rect x="380" y="122" width="40" height="8" rx="4" fill="#16181d"/>
      <path d="M120 412 H680 L664 432 Q660 438 650 438 H150 Q140 438 136 432Z" fill="url(#${p}alu)"/>
      <path d="M350 412 H450 Q446 420 436 420 H364 Q354 420 350 412Z" fill="#9aa1aa"/>`,
  },
  {
    slug: "machine-cafe",
    tint: ["#f4ece3", "#e9dccd"],
    mood: ["#2a1f17", "#120c08"],
    detail: "250 150 300 225",
    draw: (p) => `
      <defs>
        ${lg(p + "body", [["0", "#3a3d42"], ["1", "#1d1f23"]], 1, 0)}
        ${lg(p + "steel", [["0", "#f1f2f4"], ["0.5", "#b9bec5"], ["1", "#e6e8eb"]], 1, 0)}
        ${lg(p + "cup", [["0", "#ffffff"], ["1", "#e7e2db"]], 1, 0)}
        ${lg(p + "coffee", [["0", "#6b3e1f"], ["1", "#3b2010"]])}
      </defs>
      ${shadow(400, 478, 200, 14)}
      <rect x="250" y="96" width="300" height="380" rx="26" fill="url(#${p}body)"/>
      <rect x="250" y="96" width="300" height="60" rx="26" fill="url(#${p}steel)"/>
      <rect x="250" y="130" width="300" height="26" fill="url(#${p}steel)"/>
      <rect x="296" y="176" width="208" height="40" rx="8" fill="#0d0e10"/>
      <circle cx="320" cy="196" r="7" fill="#f59e0b"/><circle cx="346" cy="196" r="7" fill="#5eead4"/>
      <rect x="370" y="190" width="110" height="12" rx="6" fill="#2a2d33"/>
      <rect x="330" y="236" width="140" height="34" rx="10" fill="url(#${p}steel)"/>
      <rect x="380" y="270" width="40" height="16" rx="4" fill="#a3a8af"/>
      <rect x="398" y="286" width="4" height="54" fill="#6b3e1f" opacity=".85"/>
      <path d="M352 352 H448 L440 418 Q438 430 426 430 H374 Q362 430 360 418Z" fill="url(#${p}cup)"/>
      <path d="M448 366 Q478 368 476 390 Q474 410 444 408" fill="none" stroke="#e7e2db" stroke-width="9"/>
      <ellipse cx="400" cy="354" rx="46" ry="7" fill="url(#${p}coffee)"/>
      <rect x="290" y="432" width="220" height="22" rx="6" fill="url(#${p}steel)"/>
      <path d="M380 330 q8 -20 0 -40 M420 330 q8 -20 0 -40" stroke="#fff" stroke-width="3" fill="none" opacity=".25"/>`,
  },
  {
    slug: "aspirateur",
    tint: ["#edf1ef", "#dce5e1"],
    mood: ["#18241f", "#0a110e"],
    detail: "220 180 360 270",
    draw: (p) => `
      <defs>
        ${lg(p + "top", [["0", "#fdfdfd"], ["1", "#d9dde2"]], 1, 1)}
        ${lg(p + "side", [["0", "#2b2f36"], ["1", "#14171b"]])}
        ${lg(p + "dock", [["0", "#f5f6f7"], ["1", "#c9ced4"]])}
      </defs>
      ${shadow(400, 452, 250, 18, 0.32)}
      <rect x="560" y="236" width="110" height="200" rx="18" fill="url(#${p}dock)"/>
      <rect x="586" y="262" width="58" height="8" rx="4" fill="#94a3b8"/>
      <ellipse cx="380" cy="390" rx="230" ry="62" fill="url(#${p}side)"/>
      <rect x="150" y="330" width="460" height="60" fill="url(#${p}side)"/>
      <ellipse cx="380" cy="330" rx="230" ry="62" fill="url(#${p}top)"/>
      <ellipse cx="380" cy="330" rx="200" ry="50" fill="none" stroke="#cbd2d9" stroke-width="2"/>
      <ellipse cx="380" cy="312" rx="46" ry="14" fill="#1f2328"/>
      <rect x="334" y="296" width="92" height="16" fill="#1f2328"/>
      <ellipse cx="380" cy="296" rx="46" ry="14" fill="#2f353d"/>
      <circle cx="300" cy="338" r="7" fill="#14b8a6"/>
      <rect x="150" y="358" width="460" height="6" fill="#3a4049" opacity=".6"/>`,
  },
  {
    slug: "canape",
    tint: ["#f3ece6", "#e8dcd2"],
    mood: ["#2a201b", "#110c09"],
    detail: "120 160 360 270",
    draw: (p) => `
      <defs>
        ${lg(p + "fab", [["0", "#8fa58e"], ["1", "#6b8269"]])}
        ${lg(p + "fab2", [["0", "#a3b8a1"], ["1", "#7f977d"]])}
        ${lg(p + "wood", [["0", "#b08158"], ["1", "#7c5534"]])}
      </defs>
      ${shadow(400, 466, 320, 14)}
      <rect x="110" y="190" width="580" height="170" rx="40" fill="url(#${p}fab)"/>
      <rect x="140" y="214" width="170" height="120" rx="26" fill="url(#${p}fab2)"/>
      <rect x="315" y="214" width="170" height="120" rx="26" fill="url(#${p}fab2)"/>
      <rect x="490" y="214" width="170" height="120" rx="26" fill="url(#${p}fab2)"/>
      <rect x="80" y="260" width="90" height="170" rx="34" fill="url(#${p}fab)"/>
      <rect x="630" y="260" width="90" height="170" rx="34" fill="url(#${p}fab)"/>
      <rect x="150" y="320" width="500" height="96" rx="22" fill="url(#${p}fab2)"/>
      <line x1="316" y1="326" x2="316" y2="410" stroke="#6b8269" stroke-width="3"/>
      <line x1="484" y1="326" x2="484" y2="410" stroke="#6b8269" stroke-width="3"/>
      <rect x="180" y="226" width="96" height="80" rx="20" fill="#e9d8c4" transform="rotate(-6 228 266)"/>
      <path d="M120 430 l-8 30 h12 l10 -30Z M680 430 l8 30 h-12 l-10 -30Z" fill="url(#${p}wood)"/>`,
  },
  {
    slug: "table-manger",
    tint: ["#f2ede5", "#e5dccf"],
    mood: ["#241d16", "#0f0b08"],
    detail: "250 120 300 225",
    draw: (p) => `
      <defs>
        ${lg(p + "top", [["0", "#c99a6b"], ["1", "#a8784d"]], 1, 0)}
        ${lg(p + "edge", [["0", "#8a5f3a"], ["1", "#6e4a2c"]])}
        ${lg(p + "vase", [["0", "#f5efe6"], ["1", "#d8cdbd"]], 1, 0)}
      </defs>
      ${shadow(400, 470, 300, 12)}
      <path d="M150 270 H650 L700 312 H100Z" fill="url(#${p}top)"/>
      <rect x="100" y="312" width="600" height="18" fill="url(#${p}edge)"/>
      <path d="M140 330 h18 l-10 140 h-14Z M642 330 h18 l2 140 h-14Z" fill="url(#${p}edge)"/>
      <path d="M210 330 h14 l-4 110 h-12Z M576 330 h14 l2 110 h-12Z" fill="#5d3e25" opacity=".8"/>
      <path d="M380 200 q-24 30 -18 60 q4 18 38 18 q34 0 38 -18 q6 -30 -18 -60Z" fill="url(#${p}vase)"/>
      <path d="M392 202 q-10 -60 -40 -86 M402 200 q4 -70 30 -100 M398 200 q-30 -40 -76 -46" stroke="#5f7f5c" stroke-width="3" fill="none"/>
      <ellipse cx="350" cy="116" rx="12" ry="7" fill="#7f9d7b" transform="rotate(-30 350 116)"/>
      <ellipse cx="432" cy="100" rx="12" ry="7" fill="#7f9d7b" transform="rotate(30 432 100)"/>
      <ellipse cx="322" cy="152" rx="12" ry="7" fill="#8fae8b"/>
      <ellipse cx="250" cy="290" rx="44" ry="8" fill="#f8f4ee"/><ellipse cx="550" cy="290" rx="44" ry="8" fill="#f8f4ee"/>`,
  },
  {
    slug: "console",
    tint: ["#ecedf4", "#dcdeea"],
    mood: ["#191a2e", "#0a0a14"],
    detail: "160 200 400 300",
    draw: (p) => `
      <defs>
        ${lg(p + "shell", [["0", "#ffffff"], ["1", "#dde1e8"]], 1, 0)}
        ${lg(p + "core", [["0", "#1a1c22"], ["1", "#0b0c10"]])}
        ${lg(p + "pad", [["0", "#f8f9fb"], ["1", "#cfd4dc"]])}
      </defs>
      ${shadow(400, 470, 280, 14)}
      <path d="M440 92 q30 -6 40 20 l22 330 q2 18 -20 20 h-30Z" fill="url(#${p}shell)"/>
      <rect x="420" y="96" width="50" height="362" rx="10" fill="url(#${p}core)"/>
      <path d="M420 92 q-30 -6 -40 20 l-22 330 q-2 18 20 20 h42Z" fill="url(#${p}shell)"/>
      <rect x="443" y="110" width="4" height="330" rx="2" fill="#60a5fa" opacity=".7"/>
      <path d="M170 360 q10 -48 60 -52 h120 q50 4 60 52 l14 60 q6 34 -26 36 q-22 2 -40 -26 l-14 -20 h-108 l-14 20 q-18 28 -40 26 q-32 -2 -26 -36Z" fill="url(#${p}pad)"/>
      <circle cx="232" cy="362" r="16" fill="#2b2f37"/><circle cx="348" cy="394" r="16" fill="#2b2f37"/>
      <circle cx="372" cy="340" r="6" fill="#64748b"/><circle cx="388" cy="354" r="6" fill="#64748b"/><circle cx="356" cy="354" r="6" fill="#64748b"/><circle cx="372" cy="368" r="6" fill="#64748b"/>
      <rect x="276" y="330" width="28" height="14" rx="4" fill="#94a3b8"/>`,
  },
  {
    slug: "casque-audio",
    tint: ["#f1ede8", "#e3ddd5"],
    mood: ["#221e1a", "#0d0b09"],
    detail: "200 220 400 300",
    draw: (p) => `
      <defs>
        ${lg(p + "cup", [["0", "#3a3f47"], ["1", "#16191d"]], 1, 1)}
        ${lg(p + "pad", [["0", "#5b6270"], ["1", "#2c3038"]], 1, 1)}
        ${lg(p + "metal", [["0", "#e8e4dc"], ["1", "#b7afa3"]], 1, 0)}
      </defs>
      ${shadow(400, 480, 230, 14)}
      <path d="M232 330 C232 150 568 150 568 330" fill="none" stroke="url(#${p}metal)" stroke-width="20" stroke-linecap="round"/>
      <path d="M252 300 C262 182 538 182 548 300" fill="none" stroke="#2c3038" stroke-width="22" stroke-linecap="round"/>
      <rect x="196" y="300" width="96" height="160" rx="44" fill="url(#${p}cup)"/>
      <rect x="508" y="300" width="96" height="160" rx="44" fill="url(#${p}cup)"/>
      <rect x="270" y="314" width="34" height="132" rx="17" fill="url(#${p}pad)"/>
      <rect x="496" y="314" width="34" height="132" rx="17" fill="url(#${p}pad)"/>
      <rect x="226" y="350" width="10" height="60" rx="5" fill="#c9a96e" opacity=".8"/>
      <rect x="564" y="350" width="10" height="60" rx="5" fill="#c9a96e" opacity=".8"/>`,
  },
  {
    slug: "ecran-pc",
    tint: ["#edf0f4", "#dfe4eb"],
    mood: ["#171d29", "#090c12"],
    detail: "130 80 400 300",
    draw: (p) => `
      <defs>
        ${lg(p + "scr", [["0", "#ff9a8b"], ["0.5", "#ff6a88"], ["1", "#4a3aff"]], 1, 1)}
        ${lg(p + "stand", [["0", "#d4d8de"], ["1", "#9aa1ab"]], 1, 0)}
      </defs>
      ${shadow(400, 474, 200, 12)}
      <rect x="120" y="86" width="560" height="320" rx="12" fill="#121419"/>
      <rect x="128" y="94" width="544" height="296" rx="5" fill="url(#${p}scr)"/>
      <rect x="160" y="130" width="200" height="130" rx="10" fill="#fff" opacity=".18"/>
      <rect x="380" y="130" width="260" height="60" rx="10" fill="#fff" opacity=".12"/>
      <rect x="380" y="206" width="124" height="150" rx="10" fill="#fff" opacity=".14"/>
      <rect x="516" y="206" width="124" height="150" rx="10" fill="#fff" opacity=".1"/>
      <rect x="160" y="276" width="200" height="80" rx="10" fill="#fff" opacity=".1"/>
      <path d="M376 406 h48 l14 52 h-76Z" fill="url(#${p}stand)"/>
      <rect x="300" y="456" width="200" height="12" rx="6" fill="url(#${p}stand)"/>`,
  },
  {
    slug: "purificateur",
    tint: ["#ecf1f2", "#dbe5e7"],
    mood: ["#16232a", "#091014"],
    detail: "260 80 280 210",
    draw: (p) => `
      <defs>
        ${lg(p + "body", [["0", "#ffffff"], ["0.6", "#e9edf0"], ["1", "#c8d0d6"]], 1, 0)}
      </defs>
      ${shadow(400, 478, 140, 14)}
      <rect x="300" y="110" width="200" height="360" rx="40" fill="url(#${p}body)"/>
      <ellipse cx="400" cy="130" rx="86" ry="16" fill="#d5dce1"/>
      <ellipse cx="400" cy="128" rx="70" ry="11" fill="#9aa6af"/>
      ${Array.from({ length: 9 }, (_, i) => `<rect x="320" y="${200 + i * 26}" width="160" height="6" rx="3" fill="#cfd6dc"/>`).join("")}
      <circle cx="400" cy="174" r="12" fill="#14b8a6" opacity=".85"/>`,
  },
  {
    slug: "trottinette",
    tint: ["#eff0ec", "#e1e3dc"],
    mood: ["#1d2019", "#0b0d09"],
    detail: "120 250 300 225",
    draw: (p) => `
      <defs>${lg(p + "deck", [["0", "#3b4048"], ["1", "#1d2025"]])}</defs>
      ${shadow(400, 470, 280, 10)}
      <circle cx="200" cy="420" r="46" fill="#1f2328"/><circle cx="200" cy="420" r="20" fill="#9aa1ab"/>
      <circle cx="610" cy="420" r="46" fill="#1f2328"/><circle cx="610" cy="420" r="20" fill="#9aa1ab"/>
      <path d="M200 420 L250 396 H560 L610 420" fill="none" stroke="#2b2f36" stroke-width="10" stroke-linejoin="round"/>
      <rect x="240" y="380" width="330" height="22" rx="10" fill="url(#${p}deck)"/>
      <path d="M610 420 L560 110" stroke="#2b2f36" stroke-width="14" stroke-linecap="round"/>
      <path d="M500 104 H630" stroke="#2b2f36" stroke-width="12" stroke-linecap="round"/>
      <rect x="548" y="148" width="26" height="12" rx="4" fill="#14b8a6"/>`,
  },
];

function svg(a: Art, variant: 1 | 2 | 3) {
  const p = `${a.slug.replace(/-/g, "")}${variant}`;
  const dark = variant === 2;
  const [c1, c2] = dark ? a.mood : a.tint;
  const viewBox = variant === 3 ? a.detail : "0 0 800 600";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="bg${p}" cx="50%" cy="28%" r="80%">
      <stop offset="0" stop-color="${dark ? "#3a4252" : "#ffffff"}" stop-opacity="${dark ? 0.55 : 0.9}"/>
      <stop offset="1" stop-color="${c1}" stop-opacity="0"/>
    </radialGradient>
    ${lg("base" + p, [["0", c1], ["1", c2]])}
    ${lg("floor" + p, [["0", dark ? "#000" : c2], ["1", dark ? "#000" : c2]])}
    <filter id="blur" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="10"/></filter>
  </defs>
  <rect x="-200" y="-200" width="1200" height="1000" fill="url(#base${p})"/>
  <rect x="-200" y="-200" width="1200" height="1000" fill="url(#bg${p})"/>
  <rect x="-200" y="440" width="1200" height="400" fill="url(#floor${p})" opacity="${dark ? 0.35 : 0.45}"/>
  ${a.draw(p)}
</svg>`;
}

const out = path.join(process.cwd(), "public", "lots");
mkdirSync(out, { recursive: true });
for (const a of arts) for (const v of [1, 2, 3] as const) writeFileSync(path.join(out, `${a.slug}-${v}.svg`), svg(a, v));
console.log(`${arts.length * 3} illustrations générées dans public/lots`);
