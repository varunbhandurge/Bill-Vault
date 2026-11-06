const fs = require('fs');
const path = require('path');

const assets = [
  { name: 'honda-city.jpg', title: 'Honda City (2010)', subtitle: 'Sedan MH 02 BG 4821', icon: '🚗', color: '#1e293b' },
  { name: 'samsung-ac.jpg', title: 'Samsung WindFree AC', subtitle: '1.5 Ton Master Bedroom', icon: '❄️', color: '#0369a1' },
  { name: 'lg-fridge.jpg', title: 'LG 260L Refrigerator', subtitle: 'Double Door Kitchen', icon: '🧊', color: '#be123c' },
  { name: 'kent-ro.jpg', title: 'Kent Grand Plus RO', subtitle: '9L RO+UV+UF Purifier', icon: '💧', color: '#0d9488' },
  { name: 'macbook-pro.jpg', title: 'MacBook Pro 14"', subtitle: 'Apple M3 Pro Home Office', icon: '💻', color: '#334155' }
];

assets.forEach(a => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250">
    <rect width="400" height="250" rx="12" fill="${a.color}"/>
    <circle cx="200" cy="100" r="45" fill="white" fill-opacity="0.15"/>
    <text x="200" y="112" font-size="44" text-anchor="middle">${a.icon}</text>
    <text x="200" y="170" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">${a.title}</text>
    <text x="200" y="195" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#cbd5e1" text-anchor="middle">${a.subtitle}</text>
  </svg>`;

  fs.writeFileSync(path.join(process.cwd(), 'public', 'sample-assets', a.name.replace('.jpg', '.svg')), svg);
});

console.log('Created asset SVG graphics');
