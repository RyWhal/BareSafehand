const EDIT_TOKEN_BYTES = 32;
const HASH_ALGORITHM = "SHA-256";

function getCrypto(): Crypto {
  const runtime = globalThis as typeof globalThis & { crypto?: Crypto; self?: { crypto?: Crypto } };
  const cryptoLike = runtime.crypto ?? runtime.self?.crypto;

  if (!cryptoLike) {
    throw new Error("Web Crypto is not available");
  }

  return cryptoLike;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64UrlEncode(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function hexEncode(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function generateEditToken(): string {
  const bytes = new Uint8Array(EDIT_TOKEN_BYTES);

  getCrypto().getRandomValues(bytes);

  return base64UrlEncode(bytes);
}

export async function hashToken(token: string): Promise<string> {
  const encodedToken = new TextEncoder().encode(token);
  const digest = await getCrypto().subtle.digest(HASH_ALGORITHM, encodedToken);

  return hexEncode(new Uint8Array(digest));
}

export async function tokenToObjectKey(token: string): Promise<string> {
  return `characters/${await hashToken(token)}.json`;
}
