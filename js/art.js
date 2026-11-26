// Hand-drawn vector art for the story: four scenes and the characters. Everything is generated SVG, no image files.

const grad = (id, stops, dir = "x1=0 y1=0 x2=0 y2=1") => `<linearGradient id="${id}" ${dir}>${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
const glow = (id, c) => `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity=".95"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
const cloud = (x, y, s, d) => `<g class="cloud" style="animation-duration:${d}s;transform-origin:${x}px ${y}px"><g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity=".88"><ellipse cx="0" cy="0" rx="62" ry="22"/><ellipse cx="-30" cy="-16" rx="30" ry="22"/><ellipse cx="14" cy="-24" rx="36" ry="28"/></g></g>`;
const windows = (x, y, cols, rows, w = 14, h = 18, gap = 12) => Array.from({ length: cols * rows }, (_, i) => `<rect x="${x + (i % cols) * (w + gap)}" y="${y + Math.floor(i / cols) * (h + gap)}" width="${w}" height="${h}" rx="3" fill="#fff4d6" opacity="${i % 3 === 0 ? 0.35 : 0.85}"/>`).join("");

const SCENES = [
  // 0: street in front of the food bank, early morning
  () => `<defs>${grad("a0", [[0, "#7fb9ff"], [0.55, "#ffe6c8"], [1, "#ffd3a6"]])}${glow("s0", "#fff3c4")}${grad("w0", [[0, "#e9ad7a"], [1, "#d98f5f"]])}</defs>
    <rect width="1024" height="640" fill="url(#a0)"/><circle cx="790" cy="190" r="200" fill="url(#s0)"/><circle cx="790" cy="190" r="48" fill="#fff6cf"/>
    ${cloud(180, 120, 1.1, 60)}${cloud(520, 80, 0.8, 80)}${cloud(900, 260, 0.9, 70)}
    <g fill="#c3d2ea" opacity=".85"><rect x="20" y="300" width="70" height="170"/><rect x="100" y="260" width="60" height="210"/><rect x="170" y="320" width="90" height="150"/><rect x="270" y="280" width="64" height="190"/><rect x="345" y="330" width="80" height="140"/></g>
    <g fill="#a9bcd9"><rect x="0" y="330" width="120" height="140"/><rect x="130" y="290" width="110" height="180"/><rect x="250" y="340" width="140" height="130"/></g>
    <g>${windows(18, 345, 4, 3, 12, 16, 10)}${windows(146, 305, 4, 4, 12, 16, 10)}${windows(266, 355, 5, 2, 14, 16, 12)}</g>
    <rect x="520" y="250" width="440" height="220" rx="10" fill="#f8dcb6"/><rect x="520" y="250" width="440" height="24" rx="10" fill="#e9c595"/>
    <rect x="570" y="215" width="340" height="52" rx="14" fill="#2f9e6a"/><text x="740" y="251" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-weight="800" font-size="30" fill="#fff" letter-spacing="2">FOOD BANK</text>
    <g>${Array.from({ length: 10 }, (_, i) => `<path d="M${540 + i * 40} 290 h40 v34 q-20 14 -40 0z" fill="${i % 2 ? "#fff" : "#e5534b"}"/>`).join("")}</g>
    <rect x="780" y="340" width="90" height="130" rx="8" fill="#8a5a3c"/><circle cx="854" cy="410" r="5" fill="#f2d28c"/>
    <rect x="560" y="350" width="190" height="90" rx="10" fill="#fff6e6"/><rect x="570" y="400" width="50" height="34" rx="5" fill="#d9a05b"/><rect x="630" y="392" width="54" height="42" rx="5" fill="#e0b46c"/><circle cx="715" cy="418" r="16" fill="#e5534b"/>
    <rect y="440" width="1024" height="200" fill="#d9d2c9"/><rect y="440" width="1024" height="14" fill="#c9c1b6"/><rect y="540" width="1024" height="6" fill="#fff" opacity=".35"/>`,
  // 1: community hall with the notice board
  () => `<defs>${grad("a1", [[0, "#fdf1e1"], [1, "#f1dcbf"]])}${grad("f1", [[0, "#d9b283"], [1, "#b98a5a"]])}${glow("l1", "#fff2c2")}${grad("sk1", [[0, "#8cc4ff"], [1, "#d9efff"]])}</defs>
    <rect width="1024" height="640" fill="url(#a1)"/><circle cx="512" cy="-10" r="360" fill="url(#l1)" opacity=".6"/>
    <rect x="40" y="90" width="150" height="210" rx="10" fill="#fff"/><rect x="52" y="102" width="126" height="186" rx="6" fill="url(#sk1)"/><path d="M115 102v186M52 195h126" stroke="#fff" stroke-width="6"/><circle cx="150" cy="150" r="14" fill="#fff7d1"/>
    <rect x="236" y="56" width="552" height="310" rx="20" fill="#c99a68"/><rect x="248" y="68" width="528" height="286" rx="14" fill="#e3bd8a"/>
    <g fill="#d5ab76" opacity=".7">${Array.from({ length: 40 }, (_, i) => `<circle cx="${262 + ((i * 97) % 500)}" cy="${80 + ((i * 53) % 262)}" r="${2 + (i % 3)}"/>`).join("")}</g>
    <rect y="372" width="1024" height="16" fill="#b78c5d"/><rect y="388" width="1024" height="252" fill="url(#f1)"/>
    <g stroke="#a97b4c" stroke-width="2" opacity=".5">${Array.from({ length: 9 }, (_, i) => `<path d="M0 ${410 + i * 28}H1024"/>`).join("")}</g>
    <g><rect x="900" y="300" width="64" height="76" rx="10" fill="#c46a4a"/><path d="M932 300c-40-60-70-50-84-20 30-10 50 0 84 20zM932 300c40-60 70-50 84-20-30-10-50 0-84 20zM932 300c-10-70 10-90 20-92 8 30-4 60-20 92z" fill="#4fa36a"/></g>`,
  // 2: store room with food crates
  () => `<defs>${grad("a2", [[0, "#e1f1ee"], [1, "#c7e1dc"]])}${grad("f2", [[0, "#e8e3da"], [1, "#d4cdc0"]])}${glow("l2", "#fff0b8")}</defs>
    <rect width="1024" height="640" fill="url(#a2)"/><circle cx="512" cy="40" r="300" fill="url(#l2)" opacity=".55"/><path d="M512 0v70" stroke="#6b7c78" stroke-width="4"/><path d="M470 70h84l-14 26h-56z" fill="#f2c35b"/>
    <g>${[0, 1, 2].map((r) => `<rect x="30" y="${110 + r * 90}" width="190" height="10" rx="4" fill="#8f7357"/>${[0, 1, 2].map((c) => `<rect x="${42 + c * 60}" y="${70 + r * 90}" width="52" height="40" rx="5" fill="${["#e5534b", "#f2b544", "#4fa36a", "#5b9bd5"][(r + c) % 4]}"/><rect x="${42 + c * 60}" y="${70 + r * 90}" width="52" height="9" rx="4" fill="#fff" opacity=".35"/>`).join("")}`).join("")}</g>
    <g>${[0, 1, 2].map((r) => `<rect x="804" y="${110 + r * 90}" width="190" height="10" rx="4" fill="#8f7357"/>${[0, 1, 2].map((c) => `<rect x="${816 + c * 60}" y="${70 + r * 90}" width="52" height="40" rx="5" fill="${["#f2b544", "#5b9bd5", "#e5534b", "#4fa36a"][(r + c) % 4]}"/><rect x="${816 + c * 60}" y="${70 + r * 90}" width="52" height="9" rx="4" fill="#fff" opacity=".35"/>`).join("")}`).join("")}</g>
    <rect x="300" y="60" width="424" height="300" rx="18" fill="#fffaf0" opacity=".6"/>
    <rect y="372" width="1024" height="268" fill="url(#f2)"/><g stroke="#c4bcae" stroke-width="2">${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 90} 372L${i * 130 - 200} 640"/>`).join("")}</g>
    <rect x="290" y="340" width="444" height="34" rx="8" fill="#a98558"/><rect x="304" y="310" width="70" height="34" rx="6" fill="#e0b46c"/><rect x="384" y="300" width="64" height="44" rx="6" fill="#d9a05b"/><circle cx="640" cy="326" r="20" fill="#e5534b"/><circle cx="676" cy="330" r="16" fill="#f2b544"/>`,
  // 3: park in the late afternoon
  () => `<defs>${grad("a3", [[0, "#79a8ff"], [0.5, "#ffc79a"], [1, "#ffa874"]])}${glow("s3", "#fff0c0")}</defs>
    <rect width="1024" height="640" fill="url(#a3)"/><circle cx="230" cy="330" r="240" fill="url(#s3)"/><circle cx="230" cy="330" r="54" fill="#fff4cf"/>
    ${cloud(560, 110, 1, 75)}${cloud(900, 200, 0.8, 90)}${cloud(140, 160, 0.7, 65)}
    <path d="M0 360q180-70 360-20t380 10q150 24 284-20V640H0z" fill="#8cc48f"/><path d="M0 410q260-60 520-10t504-30V640H0z" fill="#6db37a"/>
    <rect y="446" width="1024" height="194" fill="#5aa468"/><path d="M0 560q500-70 1024-6" stroke="#e8d5a8" stroke-width="40" fill="none" opacity=".8"/>
    <g><rect x="838" y="220" width="30" height="200" rx="12" fill="#8a5a3c"/><circle cx="853" cy="190" r="86" fill="#4f9d5f"/><circle cx="800" cy="236" r="58" fill="#5db06c"/><circle cx="910" cy="232" r="60" fill="#58a967"/></g>
    <g><rect x="396" y="372" width="230" height="14" rx="6" fill="#8a5a3c"/><rect x="396" y="344" width="230" height="10" rx="5" fill="#a46f48"/><rect x="408" y="386" width="12" height="46" fill="#6e4a32"/><rect x="602" y="386" width="12" height="46" fill="#6e4a32"/></g>
    <g fill="#fff8c4">${[[120, 520], [300, 580], [700, 540], [940, 580], [520, 600]].map(([x, y], i) => `<circle class="fly" style="animation-delay:${i * 0.7}s" cx="${x}" cy="${y}" r="4"/>`).join("")}</g>`,
];

const sceneSvg = (i) => `<svg viewBox="0 0 1024 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${SCENES[i]()}</svg>`;

// A friendly flat-style person, 120x220: big head, curved limbs, soft shading. o: skin, hair, hairStyle (bun|short|pony),
// shirt, pants, lanyard (adds a blazer look), acc (accessory name).
const mix = (hex, t, to) => { const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (to - v) * t)); return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`; };
const lighter = (h, t = 0.25) => mix(h, t, 255), darker = (h, t = 0.2) => mix(h, t, 0);
let personId = 0;
function person(o) {
  const { skin = "#f1c9a5", hair = "#3b2a2a", hairStyle = "short", shirt = "#ffcc33", pants = "#3d4a63", lanyard = false, acc = "", mood = "smile" } = o;
  const id = `p${personId++}`;
  const ACCS = {
    sunhat: `<ellipse cx="60" cy="33" rx="49" ry="10" fill="#f6c74a"/><path d="M33 33Q33 5 60 5T87 33z" fill="#ffd966"/><path d="M33 33h54v-7H33z" fill="#e5534b"/><ellipse cx="60" cy="36" rx="49" ry="6" fill="#000" opacity=".06"/>`,
    catears: `<path d="M31 42L27 5l27 21z" fill="#ff7aa8"/><path d="M89 42l4-37-27 21z" fill="#ff7aa8"/><path d="M34 36l-1-17 12 10zM86 36l1-17-12 10z" fill="#ffc2d6"/>`,
    headphones: `<path d="M26 66Q24 12 60 12T94 66" stroke="#2f7fe0" stroke-width="7" fill="none" stroke-linecap="round"/><rect x="18" y="56" width="15" height="28" rx="7" fill="#2f7fe0"/><rect x="87" y="56" width="15" height="28" rx="7" fill="#2f7fe0"/><rect x="21" y="60" width="5" height="20" rx="2.5" fill="#7db5ff"/>`,
    glasses: `<circle cx="46" cy="70" r="11.5" fill="#fff" fill-opacity=".25" stroke="#2b3340" stroke-width="3"/><circle cx="74" cy="70" r="11.5" fill="#fff" fill-opacity=".25" stroke="#2b3340" stroke-width="3"/><path d="M57.5 69.5h5" stroke="#2b3340" stroke-width="3"/>`,
    beanie: `<path d="M27 52Q26 10 60 10T93 52z" fill="#8a6bd8"/><rect x="26" y="43" width="68" height="11" rx="5.5" fill="#6f52bd"/><circle cx="60" cy="8" r="7" fill="#fff"/>`,
  };
  const hairCap = `M26 66C21 28 44 20 60 20C78 20 99 28 94 66C91 52 83 45 72 43C64 51 49 50 37 45C31 49 27 57 26 66Z`;
  const hairExtra = hairStyle === "bun" ? `<circle cx="60" cy="14" r="13" fill="${hair}"/><circle cx="55" cy="10" r="4" fill="#fff" opacity=".18"/>` : hairStyle === "pony" ? `<path d="M90 50C114 54 114 94 96 102C101 86 97 70 89 61Z" fill="${hair}"/>` : "";
  const sophie = lanyard;
  return `<svg viewBox="0 0 120 220" class="person" aria-hidden="true">
    <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lighter(shirt, 0.18)}"/><stop offset="1" stop-color="${darker(shirt, 0.12)}"/></linearGradient>
    <linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lighter(skin, 0.12)}"/><stop offset="1" stop-color="${darker(skin, 0.06)}"/></linearGradient></defs>
    <ellipse cx="60" cy="212" rx="36" ry="6" fill="#000" opacity=".14"/>
    <g class="legs"><path d="M44 164h13l-1 38H43z" fill="${pants}" stroke="${pants}" stroke-width="5" stroke-linejoin="round"/><path d="M63 164h13l1 38H64z" fill="${darker(pants, 0.1)}" stroke="${darker(pants, 0.1)}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M36 207q0-10 11-10h8q4 0 4 6v4z" fill="#2c2f3a"/><path d="M84 207q0-10-11-10h-8q-4 0-4 6v4z" fill="#2c2f3a"/><path d="M40 200h8" stroke="#fff" stroke-opacity=".25" stroke-width="2" stroke-linecap="round"/></g>
    <path d="M32 116Q32 92 60 92T88 116L91 164Q91 172 83 172H37Q29 172 29 164z" fill="url(#${id}s)"/>
    <path d="M62 94Q88 94 88 116L91 164Q91 172 83 172H62z" fill="#000" opacity=".07"/>
    ${sophie ? `<path d="M50 94L60 128 70 94z" fill="#fff"/><path d="M48 94L58 132 40 140zM72 94L62 132 80 140z" fill="${darker(shirt, 0.12)}" opacity=".55"/><path d="M52 96l8 30 8-30" stroke="#e5534b" stroke-width="3" fill="none"/><rect x="54" y="124" width="12" height="16" rx="3" fill="#fff" stroke="#d6dbe4"/><rect x="57" y="128" width="6" height="2.4" rx="1.2" fill="#9aa5b8"/>` : `<path d="M46 94Q60 106 74 94" stroke="${darker(shirt, 0.2)}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M35 164H85" stroke="${darker(shirt, 0.15)}" stroke-width="2" opacity=".4"/>`}
    <path d="M51 86h18v13Q60 106 51 99z" fill="${skin}"/><path d="M51 92Q60 100 69 92v-6H51z" fill="#000" opacity=".08"/>
    <g class="arm l"><path d="M38 108Q20 120 23 148" stroke="${shirt}" stroke-width="15" fill="none" stroke-linecap="round"/><circle cx="23" cy="153" r="8.5" fill="${skin}"/></g>
    <g class="arm r"><path d="M82 108Q100 120 97 148" stroke="${darker(shirt, 0.08)}" stroke-width="15" fill="none" stroke-linecap="round"/><circle cx="97" cy="153" r="8.5" fill="${skin}"/></g>
    ${hairStyle === "pony" || hairStyle === "bun" ? hairExtra : ""}
    <ellipse cx="27" cy="70" rx="5.5" ry="7" fill="${skin}"/><ellipse cx="93" cy="70" rx="5.5" ry="7" fill="${skin}"/>
    <ellipse cx="60" cy="68" rx="33.5" ry="31" fill="url(#${id}f)"/>
    <path d="${hairCap}" fill="${hair}"/><path d="M38 34Q50 26 66 27" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".2"/>
    ${acc === "sunhat" || acc === "beanie" ? "" : ""}
    ${mood === "happy" ? `<g class="eyes"><path d="M41 73Q47 64 53 73M67 73Q73 64 79 73" stroke="#262833" stroke-width="3.6" fill="none" stroke-linecap="round"/></g>` : `<g class="eyes"><ellipse cx="47" cy="71" rx="4.6" ry="6" fill="#262833"/><ellipse cx="73" cy="71" rx="4.6" ry="6" fill="#262833"/><circle cx="48.6" cy="68.6" r="1.9" fill="#fff"/><circle cx="74.6" cy="68.6" r="1.9" fill="#fff"/></g>`}
    <path d="${mood === "worry" ? "M41 59Q47 63 53 57M67 57Q73 63 79 59" : "M41 61Q47 58 53 60M67 60Q73 58 79 61"}" stroke="${darker(hair, 0.1)}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <circle cx="38" cy="82" r="5.5" fill="#ff8f8f" opacity=".4"/><circle cx="82" cy="82" r="5.5" fill="#ff8f8f" opacity=".4"/>
    <path d="M59 77Q61 80 63 78" stroke="${darker(skin, 0.2)}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>
    ${mood === "worry" ? `<path class="mouth" d="M52 90Q60 83 68 90" stroke="#8a3b3b" stroke-width="3" fill="none" stroke-linecap="round"/>` : mood === "happy" ? `<path class="mouth" d="M46 83Q60 102 74 83z" fill="#8a3b3b" stroke="#8a3b3b" stroke-width="2.4" stroke-linejoin="round"/><path d="M52 90Q60 96 68 90" fill="#ff8f8f"/>` : `<path class="mouth" d="M50 85Q60 95 70 85Q60 88 50 85z" fill="#8a3b3b" stroke="#8a3b3b" stroke-width="2.4" stroke-linejoin="round"/>`}
    ${ACCS[acc] || ""}
  </svg>`;
}


// ---- scenes 4 and 5: the rocket cabin and Planet Zog
const starfield = (n, w, h, seed = 1) => Array.from({ length: n }, (_, i) => { const x = (Math.sin((i + seed) * 91.7) * 43758.5 % 1 + 1) % 1, y = (Math.sin((i + seed) * 12.9) * 24634.6 % 1 + 1) % 1; return `<circle cx="${Math.round(x * w)}" cy="${Math.round(y * h)}" r="${1 + (i % 3) * 0.7}" fill="#fff" opacity="${0.5 + (i % 4) * 0.12}"/>`; }).join("");
SCENES.push(
  // 4: inside the rocket
  () => `<defs>${grad("a4", [[0, "#26325c"], [1, "#141b38"]])}${grad("f4", [[0, "#46527a"], [1, "#2b3556"]])}${glow("g4", "#7fd4ff")}</defs>
    <rect width="1024" height="640" fill="url(#a4)"/>
    <g fill="#33406b" stroke="#4a5a8a" stroke-width="3"><rect x="20" y="40" width="190" height="320" rx="18"/><rect x="814" y="40" width="190" height="320" rx="18"/></g>
    <g>${[0, 1, 2, 3, 4, 5].map((i) => `<circle class="fly" style="animation-delay:${i * 0.4}s" cx="${50 + (i % 3) * 60}" cy="${80 + Math.floor(i / 3) * 70}" r="9" fill="${["#ff6b6b", "#ffd166", "#6bffb0"][i % 3]}"/><circle class="fly" style="animation-delay:${i * 0.5}s" cx="${844 + (i % 3) * 60}" cy="${80 + Math.floor(i / 3) * 70}" r="9" fill="${["#6bffb0", "#ff6b6b", "#ffd166"][i % 3]}"/>`).join("")}<rect x="40" y="250" width="150" height="60" rx="10" fill="#0e1530"/><path d="M50 290l20-24 18 14 22-30 20 22 24-14" stroke="#6bffb0" stroke-width="3" fill="none"/></g>
    <circle cx="512" cy="190" r="170" fill="url(#g4)" opacity=".35"/>
    <circle cx="512" cy="190" r="140" fill="#0a1026" stroke="#a8b8dc" stroke-width="16"/><g clip-path="circle(126px at 512px 190px)">${starfield(40, 1024, 380, 3)}<circle cx="470" cy="230" r="58" fill="#3b82d6"/><path d="M440 210q20-26 46-10 12 12-4 24-20 6-42-14zM470 260q18-8 36 4-10 16-30 12z" fill="#5cc27a"/><circle cx="580" cy="130" r="20" fill="#e8e4d6"/></g>
    <g fill="#a8b8dc">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<circle cx="${512 + Math.cos(i * 0.785) * 163}" cy="${190 + Math.sin(i * 0.785) * 163}" r="6"/>`).join("")}</g>
    <rect y="372" width="1024" height="268" fill="url(#f4)"/><g stroke="#5a6a98" stroke-width="2" opacity=".6">${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 90} 372L${i * 140 - 250} 640"/>`).join("")}</g>
    <rect x="270" y="318" width="484" height="62" rx="14" fill="#3a4770" stroke="#59699a" stroke-width="3"/><g>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<circle cx="${310 + i * 62}" cy="348" r="11" fill="${["#ff6b6b", "#ffd166", "#6bffb0", "#7fd4ff"][i % 4]}"/>`).join("")}</g>`,
  // 5: Planet Zog
  () => `<defs>${grad("a5", [[0, "#2b1a5e"], [0.55, "#8a3f9e"], [1, "#ff9a76"]])}${glow("m5", "#ffe9b8")}${grad("f5", [[0, "#6a4aa8"], [1, "#43306f"]])}</defs>
    <rect width="1024" height="640" fill="url(#a5)"/>${starfield(50, 1024, 300, 7)}
    <circle cx="760" cy="150" r="130" fill="url(#m5)" opacity=".5"/><circle cx="760" cy="150" r="62" fill="#ffe9b8"/><circle cx="740" cy="130" r="12" fill="#f0d49a"/><circle cx="782" cy="170" r="8" fill="#f0d49a"/><circle cx="330" cy="110" r="34" fill="#c7b8ff"/><circle cx="318" cy="102" r="7" fill="#aa98ee"/>
    <path d="M0 380q150-110 300-40t330-50 394 50V640H0z" fill="#5a3a92"/><path d="M0 420q260-70 520-20t504-30V640H0z" fill="#4d3282"/>
    <g>${[[90, 380, 0], [250, 392, 1], [880, 372, 2], [960, 402, 0]].map(([x, y, k]) => `<path d="M${x} ${y}l-16-90 22 18 10-48 12 52 20-24-10 92z" fill="${["#59e0e6", "#ff8fd0", "#8affc1"][k]}" opacity=".9"/><path d="M${x} ${y}l-6-70 14 14 6-30z" fill="#fff" opacity=".35"/>`).join("")}</g>
    <g><path d="M660 392v-70" stroke="#b8f0d4" stroke-width="8" stroke-linecap="round"/><ellipse cx="660" cy="312" rx="44" ry="26" fill="#ff9fd0"/><circle cx="640" cy="308" r="7" fill="#fff" opacity=".6"/><path d="M420 400v-50" stroke="#b8f0d4" stroke-width="7" stroke-linecap="round"/><ellipse cx="420" cy="342" rx="32" ry="20" fill="#8affc1"/></g>
    <rect y="436" width="1024" height="204" fill="url(#f5)"/><path d="M0 520q500-60 1024-8" stroke="#8de3d3" stroke-width="34" fill="none" opacity=".55"/>
    <g><path d="M886 436l-22-12v-74q22-52 44 0v74z" fill="#e5534b"/><circle cx="886" cy="372" r="9" fill="#cfe9ff"/><path d="M864 424l-18 24 18-6zM908 424l18 24-18-6z" fill="#b83a34"/></g>
    <g fill="#fff8c4">${[[130, 520], [420, 590], [800, 560], [560, 610]].map(([x, y], i) => `<circle class="fly" style="animation-delay:${i * 0.6}s" cx="${x}" cy="${y}" r="4"/>`).join("")}</g>`,
);

// ---- characters: Captain Bolt the robot, Zog the alien, and a cat for the player. Same 120x220 frame as person().
function robot(o = {}) {
  const { mood = "smile" } = o, id = `r${personId++}`;
  const eyes = mood === "happy" ? `<path d="M40 66q8-12 16 0M64 66q8-12 16 0" stroke="#7ff3ff" stroke-width="4" fill="none" stroke-linecap="round"/>` : `<ellipse cx="48" cy="64" rx="6" ry="${mood === "worry" ? 6 : 8}" fill="#7ff3ff"/><ellipse cx="72" cy="64" rx="6" ry="${mood === "worry" ? 6 : 8}" fill="#7ff3ff"/><circle cx="50" cy="61" r="2" fill="#fff"/><circle cx="74" cy="61" r="2" fill="#fff"/>`;
  const mouth = mood === "worry" ? `M50 82q10-6 20 0` : mood === "happy" ? `M46 76q14 14 28 0z` : `M50 78q10 8 20 0`;
  return `<svg viewBox="0 0 120 220" class="person" aria-hidden="true"><defs><linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fc4e8"/><stop offset="1" stop-color="#4a8fc4"/></linearGradient><linearGradient id="${id}h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9f1fa"/><stop offset="1" stop-color="#b9c8dc"/></linearGradient></defs>
    <ellipse cx="60" cy="212" rx="36" ry="6" fill="#000" opacity=".14"/>
    <g class="legs"><rect x="42" y="166" width="16" height="34" rx="8" fill="#8b97ad"/><rect x="62" y="166" width="16" height="34" rx="8" fill="#7a869c"/><rect x="36" y="196" width="26" height="12" rx="6" fill="#4c5a76"/><rect x="58" y="196" width="26" height="12" rx="6" fill="#4c5a76"/></g>
    <rect x="32" y="100" width="56" height="72" rx="18" fill="url(#${id}b)"/><rect x="44" y="116" width="32" height="28" rx="8" fill="#e9f4ff"/><circle cx="52" cy="130" r="4" fill="#ff6b6b"/><circle cx="62" cy="130" r="4" fill="#ffd166"/><circle cx="72" cy="130" r="4" fill="#6bffb0"/><path d="M36 160h48" stroke="#2f6f9f" stroke-width="2" opacity=".4"/>
    <g class="arm l"><path d="M38 112Q18 126 22 152" stroke="#9fb2c8" stroke-width="13" fill="none" stroke-linecap="round"/><circle cx="22" cy="156" r="9" fill="#d9e2ee"/></g>
    <g class="arm r"><path d="M82 112Q102 126 98 152" stroke="#8ea2ba" stroke-width="13" fill="none" stroke-linecap="round"/><circle cx="98" cy="156" r="9" fill="#d9e2ee"/></g>
    <rect x="52" y="94" width="16" height="12" rx="4" fill="#4c5a76"/>
    <path d="M60 30V12" stroke="#8b97ad" stroke-width="4"/><circle cx="60" cy="10" r="7" fill="#ff6b6b"/><circle cx="58" cy="8" r="2.4" fill="#fff" opacity=".7"/>
    <circle cx="24" cy="64" r="8" fill="#8b97ad"/><circle cx="96" cy="64" r="8" fill="#8b97ad"/>
    <rect x="24" y="30" width="72" height="68" rx="28" fill="url(#${id}h)"/><rect x="33" y="46" width="54" height="40" rx="18" fill="#1b2a4a"/><path d="M40 52q20-8 40 0" stroke="#fff" stroke-width="3" fill="none" opacity=".25" stroke-linecap="round"/>
    <g class="eyes">${eyes}</g><path class="mouth" d="${mouth}" stroke="#7ff3ff" stroke-width="3" fill="${mood === "happy" ? "#7ff3ff" : "none"}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function alien(o = {}) {
  const { mood = "smile" } = o, id = `z${personId++}`;
  const mouth = mood === "worry" ? `M50 92q10-7 20 0` : mood === "happy" ? `M46 86q14 16 28 0z` : `M50 88q10 8 20 0`;
  const pupils = mood === "happy" ? `<path d="M36 72q10-12 20 0M64 72q10-12 20 0" stroke="#2b1e4a" stroke-width="4" fill="none" stroke-linecap="round"/>` : `<ellipse cx="46" cy="72" rx="11" ry="13" fill="#fff"/><ellipse cx="74" cy="72" rx="11" ry="13" fill="#fff"/><ellipse cx="47" cy="74" rx="6.5" ry="9" fill="#2b1e4a"/><ellipse cx="75" cy="74" rx="6.5" ry="9" fill="#2b1e4a"/><circle cx="49" cy="70" r="2.4" fill="#fff"/><circle cx="77" cy="70" r="2.4" fill="#fff"/>`;
  return `<svg viewBox="0 0 120 220" class="person" aria-hidden="true"><defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9af0b8"/><stop offset="1" stop-color="#46b383"/></linearGradient></defs>
    <ellipse cx="60" cy="212" rx="38" ry="6" fill="#000" opacity=".14"/>
    <ellipse cx="44" cy="205" rx="15" ry="7" fill="#3a9a73"/><ellipse cx="76" cy="205" rx="15" ry="7" fill="#3a9a73"/>
    <path d="M28 204Q20 128 60 106Q100 128 92 204Z" fill="url(#${id}g)"/><ellipse cx="60" cy="158" rx="22" ry="30" fill="#c9fadb" opacity=".6"/>
    <g class="arm l"><path d="M36 124Q16 138 22 160" stroke="#5cc796" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="22" cy="163" r="8" fill="#7ad9ac"/></g>
    <g class="arm r"><path d="M84 124Q104 138 98 160" stroke="#4fb887" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="98" cy="163" r="8" fill="#7ad9ac"/></g>
    <path d="M44 40Q38 20 32 12M76 40Q82 20 88 12" stroke="#46b383" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="31" cy="11" r="7" fill="#ff8fd0"/><circle cx="89" cy="11" r="7" fill="#ff8fd0"/>
    <ellipse cx="60" cy="72" rx="42" ry="38" fill="url(#${id}g)"/><circle cx="36" cy="46" r="4" fill="#46b383" opacity=".5"/><circle cx="82" cy="48" r="3" fill="#46b383" opacity=".5"/><circle cx="60" cy="40" r="3" fill="#46b383" opacity=".5"/>
    <g class="eyes">${pupils}</g><circle cx="30" cy="88" r="6" fill="#ff8fa8" opacity=".5"/><circle cx="90" cy="88" r="6" fill="#ff8fa8" opacity=".5"/>
    <path class="mouth" d="${mouth}" stroke="#2b1e4a" stroke-width="3" fill="${mood === "happy" ? "#8a2e4a" : "none"}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function cat(o = {}) {
  const { mood = "smile" } = o, id = `c${personId++}`;
  const eyes = mood === "happy" ? `<path d="M41 70q7-10 14 0M65 70q7-10 14 0" stroke="#262833" stroke-width="3.6" fill="none" stroke-linecap="round"/>` : `<ellipse cx="48" cy="70" rx="5" ry="${mood === "worry" ? 6 : 7}" fill="#262833"/><ellipse cx="72" cy="70" rx="5" ry="${mood === "worry" ? 6 : 7}" fill="#262833"/><circle cx="49.6" cy="67.4" r="2" fill="#fff"/><circle cx="73.6" cy="67.4" r="2" fill="#fff"/>`;
  return `<svg viewBox="0 0 120 220" class="person" aria-hidden="true"><defs><linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffbe6a"/><stop offset="1" stop-color="#ee9438"/></linearGradient></defs>
    <ellipse cx="60" cy="212" rx="36" ry="6" fill="#000" opacity=".14"/>
    <path d="M88 176Q122 168 112 128" stroke="#ee9438" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M112 128q-2 6-6 10" stroke="#fff3df" stroke-width="13" fill="none" stroke-linecap="round" opacity="0"/>
    <g class="legs"><rect x="42" y="168" width="16" height="32" rx="8" fill="#ee9438"/><rect x="62" y="168" width="16" height="32" rx="8" fill="#e08a30"/><ellipse cx="48" cy="205" rx="14" ry="7" fill="#fff3df"/><ellipse cx="74" cy="205" rx="14" ry="7" fill="#fff3df"/></g>
    <path d="M32 120Q32 96 60 96T88 120L90 168Q90 176 82 176H38Q30 176 30 168z" fill="url(#${id}f)"/><ellipse cx="60" cy="146" rx="18" ry="26" fill="#fff3df"/><path d="M34 112Q60 130 86 112" stroke="#2f7fe0" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="60" cy="126" r="7" fill="#ffd166"/><path d="M60 120l1.8 4 4.2.4-3.2 2.8 1 4.2-3.8-2.2-3.8 2.2 1-4.2-3.2-2.8 4.2-.4z" fill="#fff"/>
    <g class="arm l"><path d="M38 112Q22 124 25 150" stroke="#ee9438" stroke-width="13" fill="none" stroke-linecap="round"/><circle cx="25" cy="154" r="8" fill="#fff3df"/></g>
    <g class="arm r"><path d="M82 112Q98 124 95 150" stroke="#e08a30" stroke-width="13" fill="none" stroke-linecap="round"/><circle cx="95" cy="154" r="8" fill="#fff3df"/></g>
    <path d="M28 52L24 6l30 24zM92 52l4-46-30 24z" fill="#ee9438"/><path d="M32 44l-2-24 16 13zM88 44l2-24-16 13z" fill="#ffb3c6"/>
    <ellipse cx="60" cy="68" rx="38" ry="32" fill="url(#${id}f)"/><path d="M52 40v10M60 38v12M68 40v10" stroke="#c9731f" stroke-width="3.4" stroke-linecap="round"/>
    <g class="eyes">${eyes}</g><ellipse cx="60" cy="84" rx="16" ry="11" fill="#fff3df"/><path d="M56 76h8l-4 5z" fill="#ff8fa8"/><path class="mouth" d="${mood === "happy" ? "M51 84q4 10 9 2q5 8 9-2" : mood === "worry" ? "M52 90q4-5 8 0q4-5 8 0" : "M52 84q4 6 8 0q4 6 8 0"}" stroke="#7a3b3b" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M30 80l-18-4M30 86l-18 4M90 80l18-4M90 86l18 4" stroke="#7a5a3a" stroke-width="2" stroke-linecap="round"/><circle cx="34" cy="84" r="5" fill="#ff8f8f" opacity=".35"/><circle cx="86" cy="84" r="5" fill="#ff8f8f" opacity=".35"/></svg>`;
}

const CAST = {
  sophie: (mood) => person({ skin: "#efc2a0", hair: "#34252a", hairStyle: "bun", shirt: "#2f9e9a", pants: "#34425c", lanyard: true, mood }),
  sam: (mood) => person({ skin: "#f3cfae", hair: "#6b4a2e", hairStyle: "short", shirt: "#ff9f43", pants: "#4a5d8a", mood }),
  bolt: (mood) => robot({ mood }),
  zog: (mood) => alien({ mood }),
  mimi: (mood) => cat({ mood }),
  lily: (mood) => person({ skin: "#e6b894", hair: "#2b2230", hairStyle: "pony", shirt: "#e5534b", pants: "#3d4a63", mood }),
};
const SHIRTS = { Yellow: "#ffcc33", Pink: "#ff7aa8", Blue: "#4aa3ff", Green: "#4fc08d", Beige: "#d9b88f", Cat: "#f6a54b" };
const HAIRS = { Yellow: ["#3a2c22", "short"], Pink: ["#2b2230", "pony"], Blue: ["#222a3a", "short"], Green: ["#5a3b27", "pony"], Beige: ["#2f2a26", "short"] };
const ACC_OF = { Yellow: "sunhat", Pink: "catears", Blue: "headphones", Green: "glasses", Beige: "beanie" };
const avatar = (color) => color === "Cat" ? cat() : person({ skin: "#f0c8a4", hair: HAIRS[color][0], hairStyle: HAIRS[color][1], shirt: SHIRTS[color], pants: "#3d4a63", acc: ACC_OF[color] });
// People who come to the food bank, one per answered question.
const WALKERS = [["#f3cfae", "#4a3326", "short", "#ef6f6c"], ["#e6b894", "#2b2230", "pony", "#59c3c3"], ["#f0c8a4", "#8a8a8a", "bun", "#f4a261"], ["#d9a57e", "#222", "short", "#8e7dbe"], ["#f3cfae", "#6b4a2e", "pony", "#6bbf59"]];
const walker = (i) => { const [skin, hair, hairStyle, shirt] = WALKERS[i % WALKERS.length]; return person({ skin, hair, hairStyle, shirt, pants: "#4a5568" }); };
