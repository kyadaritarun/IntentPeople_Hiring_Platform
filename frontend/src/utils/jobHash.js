/**
 * Reversible, secure short code generator for job URLs.
 * Encodes integer job IDs into unguessable 6-7 character alphanumeric tokens (e.g. '2yxsr6')
 * prevents URL scraping, enumeration, and tampering.
 */

const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

function feistelEncrypt(n) {
  let L = (n >>> 16) & 0xFFFF;
  let R = n & 0xFFFF;
  const keys = [0x4B3C, 0x8F12, 0xD275, 0x6E9A];
  for (const key of keys) {
    const nextR = (L ^ (((R * 0x5BD1 + key) ^ (R >>> 5)) & 0xFFFF)) & 0xFFFF;
    L = R;
    R = nextR;
  }
  return ((L << 16) | R) >>> 0;
}

export function encodeJobId(jobId) {
  const id = parseInt(jobId, 10);
  if (!id || id <= 0 || isNaN(id)) return '';
  let enc = feistelEncrypt(id);
  const res = [];
  const base = ALPHABET.length;
  while (enc > 0) {
    res.push(ALPHABET[enc % base]);
    enc = Math.floor(enc / base);
  }
  while (res.length < 6) {
    res.push(ALPHABET[0]);
  }
  return res.reverse().join('');
}

export function getJobShareCode(job) {
  if (!job) return '';
  if (job.share_code) return job.share_code;
  if (job.id) return encodeJobId(job.id);
  return '';
}
