"""
Reversible, secure short code generator for job URLs.
Encodes integer job IDs into unguessable 6-7 character alphanumeric tokens (e.g., '2yxsr6')
using a 32-bit bijective Feistel cipher, preventing URL scraping and enumeration.
"""

from typing import Optional

ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz"  # 31 chars, avoids confusing characters: 0, O, 1, I, l

def feistel_encrypt(n: int) -> int:
    L = (n >> 16) & 0xFFFF
    R = n & 0xFFFF
    for key in (0x4B3C, 0x8F12, 0xD275, 0x6E9A):
        L, R = R, L ^ (((R * 0x5BD1 + key) ^ (R >> 5)) & 0xFFFF)
    return (L << 16) | R

def feistel_decrypt(n: int) -> int:
    L = (n >> 16) & 0xFFFF
    R = n & 0xFFFF
    for key in (0x6E9A, 0xD275, 0x8F12, 0x4B3C):
        R, L = L, R ^ (((L * 0x5BD1 + key) ^ (L >> 5)) & 0xFFFF)
    return (L << 16) | R

def encode_job_id(job_id: int) -> str:
    """Encode an integer job ID into a short, unguessable string code."""
    if not isinstance(job_id, int) or job_id <= 0:
        return ""
    enc = feistel_encrypt(job_id)
    res = []
    base = len(ALPHABET)
    while enc > 0:
        res.append(ALPHABET[enc % base])
        enc //= base
    while len(res) < 6:
        res.append(ALPHABET[0])
    return "".join(reversed(res))

def decode_job_id(code: str) -> Optional[int]:
    """Decode a short code or numeric string back to an integer job ID."""
    if not code:
        return None
    code_str = str(code).strip().lower()

    # Direct integer support (backward compatibility for legacy numeric links)
    if code_str.isdigit():
        val = int(code_str)
        return val if val > 0 else None

    base = len(ALPHABET)
    n = 0
    for char in code_str:
        idx = ALPHABET.find(char)
        if idx == -1:
            return None
        n = n * base + idx

    try:
        dec = feistel_decrypt(n)
        return dec if dec > 0 else None
    except Exception:
        return None
