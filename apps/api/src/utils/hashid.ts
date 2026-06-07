import Hashids from "hashids";

function getHashids(salt: string): Hashids {
  return new Hashids(salt, 8);
}

export function encodeId(id: string, salt: string): string {
  return getHashids(salt).encode(BigInt(id));
}

export function decodeId(hash: string, salt: string): string | null {
  const decoded = getHashids(salt).decode(hash);
  if (decoded.length === 0) return null;
  return BigInt(decoded[0]).toString();
}