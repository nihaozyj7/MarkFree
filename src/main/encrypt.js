import { app } from 'electron'
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const PREFIX = '$enc$'

function getKey() {
  const seed = app.getPath('userData')
  return crypto.scryptSync(seed, 'markfree-encryption-salt', 32)
}

export function encrypt(plaintext) {
  if (!plaintext) return plaintext
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag().toString('hex')
  const payload = JSON.stringify({ iv, encrypted, tag })
  return PREFIX + Buffer.from(payload).toString('base64url')
}

export function decrypt(encoded) {
  if (!encoded || typeof encoded !== 'string' || !encoded.startsWith(PREFIX)) return encoded
  try {
    const json = Buffer.from(encoded.slice(PREFIX.length), 'base64url').toString('utf8')
    const { iv, encrypted, tag } = JSON.parse(json)
    const key = getKey()
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'))
    decipher.setAuthTag(Buffer.from(tag, 'hex'))
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return encoded
  }
}
