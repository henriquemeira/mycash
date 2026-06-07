import Hashids from "hashids";

let hashids: Hashids | null = null;

function getHashids(salt: string): Hashids {
  if (!hashids) {
    hashids = new Hashids(salt, 8);
  }
  return hashids;
}

export function encodeId(id: bigint, salt: string): string {
  return getHashids(salt).encode(BigInt(id).toString());
}

export function decodeId(hash: string, salt: string): bigint | null {
  const decoded = getHashids(salt).decode(hash);
  if (decoded.length === 0) return null;
  return BigInt(decoded[0]);
}
