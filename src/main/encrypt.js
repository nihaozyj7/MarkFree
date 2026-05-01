import { safeStorage } from 'electron'
import crypto from 'crypto'

const SAFE_PREFIX = '$safe$'
const OLD_PREFIX = '$enc$'
const OLD_ALGORITHM = 'aes-256-gcm'

function getLegacyKey() {
  const { app } = require('electron')
  return crypto.scryptSync(app.getPath('userData'), 'markfree-encryption-salt', 32)
}

function decryptLegacy(encoded) {
  try {
    const json = Buffer.from(encoded.slice(OLD_PREFIX.length), 'base64url').toString('utf8')
    const { iv, encrypted, tag } = JSON.parse(json)
    const key = getLegacyKey()
    const decipher = crypto.createDecipheriv(OLD_ALGORITHM, key, Buffer.from(iv, 'hex'))
    decipher.setAuthTag(Buffer.from(tag, 'hex'))
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (e) {
    console.error('解密旧格式密钥失败:', e)
    return encoded
  }
}

export function encrypt(plaintext) {
  if (!plaintext) return plaintext
  if (safeStorage.isEncryptionAvailable()) {
    const buf = safeStorage.encryptString(plaintext)
    return SAFE_PREFIX + buf.toString('base64')
  }
  return plaintext
}

export function decrypt(encoded) {
  if (!encoded || typeof encoded !== 'string') return encoded
  if (encoded.startsWith(SAFE_PREFIX)) {
    try {
      if (safeStorage.isEncryptionAvailable()) {
        return safeStorage.decryptString(Buffer.from(encoded.slice(SAFE_PREFIX.length), 'base64'))
      }
    } catch (e) { console.error('解密失败:', e) }
    return encoded
  }
  if (encoded.startsWith(OLD_PREFIX)) {
    return decryptLegacy(encoded)
  }
  return encoded
}
