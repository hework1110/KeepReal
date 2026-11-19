/* 把 src 下的模块拼成自包含单文件 outputs/index.html */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'outputs', 'index.html');

function read(name){
  return fs.readFileSync(path.join(SRC, name), 'utf8').replace(/^\uFEFF/, '');
}

let baseCss = read('base.css').trimEnd();
if(!baseCss.endsWith('</style>')) throw new Error('base.css 应以 </style> 结尾');
baseCss = baseCss.slice(0, -'</style>'.length).trimEnd();
const css = baseCss + '\n\n' + read('app.css').replace(/^\s+/, '') + '\n</style>';

const sprite = read('sprite.html').trim();
const body = read('body.html').trim();

const jsFiles = [
  '01-data.js',
  '02-core.js',
  '03-views-shell.js',
  '04-plan.js',
  '05-progress.js',
  '06-body.js',
  '07-workout.js',
  '08-onboarding.js',
  '09-events.js'
];
const js = jsFiles.map(f => '/* ===== ' + f + ' ===== */\n' + read(f).trim()).join('\n\n');

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="dark">
<title>KEEPREAL · 训练原型</title>
${css}
</head>
<body>
${sprite}
${body}
<script>
${js}
</script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(OUT), {recursive:true});
fs.writeFileSync(OUT, Buffer.from(html, 'utf8'));
console.log('built ->', OUT, (html.length / 1024).toFixed(1) + ' KB');
