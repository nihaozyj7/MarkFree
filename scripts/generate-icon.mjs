import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svg = readFileSync(resolve(__dirname, '../resources/icon.svg'))

async function main() {
  const png = await sharp(svg)
    .resize(256, 256)
    .png()
    .toBuffer()

  writeFileSync(resolve(__dirname, '../resources/icon.png'), png)
  console.log('Generated resources/icon.png (256x256)')
}

main().catch(console.error)
