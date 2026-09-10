const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function decodeBase58(value) {
  let number = 0n;
  for (const character of value) {
    const index = BASE58.indexOf(character);
    if (index === -1) throw new Error("Invalid base58 character.");
    number = number * 58n + BigInt(index);
  }
  const bytes = [];
  while (number > 0n) {
    bytes.unshift(Number(number & 255n));
    number >>= 8n;
  }
  const leadingZeros = value.match(/^1*/)?.[0].length ?? 0;
  return Uint8Array.from([...Array(leadingZeros).fill(0), ...bytes]);
}

function decodeBase32(value) {
  let bits = 0;
  let buffer = 0;
  const bytes = [];
  for (const character of value) {
    const index = BASE32.indexOf(character);
    if (index === -1) throw new Error("Invalid base32 character.");
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 255);
      buffer &= (1 << bits) - 1;
    }
  }
  return Uint8Array.from(bytes);
}

function crc16Xmodem(bytes) {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc;
}

export function isValidEvmAddress(value) {
  return typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);
}

export function isValidSolanaAddress(value) {
  if (typeof value !== "string" || value.length < 32 || value.length > 44) return false;
  try {
    return decodeBase58(value).length === 32;
  } catch {
    return false;
  }
}

export function isValidStellarAddress(value) {
  if (typeof value !== "string" || !/^G[A-Z2-7]{55}$/.test(value)) return false;
  try {
    const decoded = decodeBase32(value);
    if (decoded.length !== 35 || decoded[0] !== 48) return false;
    const payload = decoded.slice(0, 33);
    const expected = decoded[33] | (decoded[34] << 8);
    return crc16Xmodem(payload) === expected;
  } catch {
    return false;
  }
}
