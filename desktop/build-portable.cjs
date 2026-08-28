'use strict';

const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const RELEASE_DIR = path.join(ROOT, 'release');
const UNPACKED_DIR = path.join(RELEASE_DIR, 'win-unpacked');
const STAGE_DIR = path.join(RELEASE_DIR, '.portable-stage');
const ARCHIVE_PATH = path.join(RELEASE_DIR, '.portable.7z');
const CONFIG_PATH = path.join(RELEASE_DIR, '.portable-config.txt');
const VERSION = require(path.join(ROOT, 'package.json')).version;
const PORTABLE_PATH = path.join(RELEASE_DIR, `Super-Mario-${VERSION}-portable.exe`);
const ZIP_PATH = path.join(RELEASE_DIR, `Super-Mario-${VERSION}-windows-x64.zip`);
const ELECTRON_DIST = path.join(ROOT, 'node_modules', 'electron', 'dist');
const SEVEN_ZIP = process.env.SEVEN_ZIP_PATH || 'C:\\Program Files\\7-Zip\\7z.exe';
const SEVEN_ZIP_SFX = process.env.SEVEN_ZIP_SFX_PATH || path.join(path.dirname(SEVEN_ZIP), '7z.sfx');

function requireFile(file, label) {
  if (!fs.existsSync(file)) throw new Error(`${label} is missing: ${file}`);
}

function run(command, args, cwd) {
  childProcess.execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    windowsHide: true
  });
}

function removeGenerated(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function copyAppFile(source, destination) {
  const from = path.join(ROOT, source);
  const to = path.join(destination, source);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

requireFile(ELECTRON_DIST, 'Electron runtime');
requireFile(SEVEN_ZIP, '7-Zip executable');
requireFile(SEVEN_ZIP_SFX, '7-Zip SFX module');

fs.mkdirSync(RELEASE_DIR, { recursive: true });
for (const target of [UNPACKED_DIR, STAGE_DIR, ARCHIVE_PATH, CONFIG_PATH, PORTABLE_PATH, ZIP_PATH]) {
  removeGenerated(target);
}

fs.cpSync(ELECTRON_DIST, UNPACKED_DIR, { recursive: true });
const appDir = path.join(UNPACKED_DIR, 'resources', 'app');
fs.mkdirSync(appDir, { recursive: true });
for (const source of ['package.json', 'index.html', 'app.js', 'sw.js', 'manifest.webmanifest', 'desktop', 'js', 'assets']) {
  copyAppFile(source, appDir);
}

const electronExe = path.join(UNPACKED_DIR, 'electron.exe');
const appExe = path.join(UNPACKED_DIR, 'Super Mario.exe');
requireFile(electronExe, 'Electron executable');
fs.renameSync(electronExe, appExe);

fs.cpSync(UNPACKED_DIR, STAGE_DIR, { recursive: true });
run(SEVEN_ZIP, ['a', '-t7z', '-mx=9', ARCHIVE_PATH, '.'], STAGE_DIR);
fs.writeFileSync(CONFIG_PATH, [
  ';!@Install@!UTF-8!',
  'Title="Super Mario"',
  'BeginPrompt="Launch the portable Super Mario desktop app?"',
  'RunProgram="Super Mario.exe"',
  ';!@InstallEnd@!',
  ''
].join('\r\n'), 'utf8');

fs.writeFileSync(PORTABLE_PATH, Buffer.concat([
  fs.readFileSync(SEVEN_ZIP_SFX),
  fs.readFileSync(CONFIG_PATH),
  fs.readFileSync(ARCHIVE_PATH)
]));
run(SEVEN_ZIP, ['a', '-tzip', '-mx=9', ZIP_PATH, '.'], UNPACKED_DIR);

removeGenerated(STAGE_DIR);
removeGenerated(ARCHIVE_PATH);
removeGenerated(CONFIG_PATH);

console.log(`Portable executable: ${PORTABLE_PATH}`);
console.log(`Windows folder archive: ${ZIP_PATH}`);
