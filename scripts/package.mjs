import { spawnSync } from 'child_process'
import { existsSync, renameSync, rmSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { path7za } from '7zip-bin'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'))
const { version } = pkg
const productName = pkg.build.productName
const distDir = resolve(root, 'dist')

function run(cmd, args) {
  const label = `${cmd} ${args.join(' ')}`
  console.log(`\n> ${label}`)
  console.log('='.repeat(Math.min(label.length + 2, 60)))
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: true })
  if (result.status !== 0) {
    console.error(`\nCommand failed with status ${result.status}`)
    process.exit(result.status)
  }
}

const targets = process.argv.slice(2)
const doWin = targets.includes('--win') || targets.length === 0
const doMac = targets.includes('--mac') || targets.length === 0
const doLinux = targets.includes('--linux') || targets.length === 0

// Step 1: Generate icon + Build
console.log('=== Generate icon ===')
run('node', ['scripts/generate-icon.mjs'])

console.log('\n=== Build ===')
run('npx', ['electron-vite', 'build'])

// Step 2: Package Windows (NSIS installer + portable .7z)
if (doWin) {
  console.log('\n=== Package Windows (NSIS installer) ===')
  run('npx', ['electron-builder', '--win', '--x64'])

  console.log('\n=== Create Windows portable .7z ===')
  const portableName = `${productName}-${version}-win-x64`
  const unpacked = resolve(distDir, 'win-unpacked')

  if (existsSync(unpacked)) {
    const portableDir = resolve(distDir, portableName)
    renameSync(unpacked, portableDir)
    run(path7za, ['a', '-mx=9', resolve(distDir, `${portableName}.7z`), portableDir])
    rmSync(portableDir, { recursive: true, force: true })
    console.log(`\n  Created: dist/${portableName}.7z`)
  } else {
    console.warn('  win-unpacked not found — skipping .7z')
  }
}

// Step 3: Package macOS
if (doMac) {
  console.log('\n=== Package macOS (DMG) ===')
  run('npx', ['electron-builder', '--mac', '--x64', '--arm64'])
}

// Step 4: Package Linux
if (doLinux) {
  console.log('\n=== Package Linux (AppImage) ===')
  run('npx', ['electron-builder', '--linux', '--x64'])
}

console.log('\n=== Build finished ===\n')
