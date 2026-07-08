import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

// =====================================================================
// Chiffrement des jetons OAuth (AES-256-GCM)
// La clé provient de CONNECTORS_ENCRYPTION_KEY si présente, sinon elle
// est dérivée de SUPABASE_SERVICE_ROLE_KEY (déjà secrète) pour que le
// développement local fonctionne sans configuration supplémentaire.
// Format stocké : "v1:" + base64(iv[12] | authTag[16] | ciphertext)
// =====================================================================

function key(): Buffer {
  const explicit = process.env.CONNECTORS_ENCRYPTION_KEY;
  const source =
    explicit && explicit.length > 0
      ? explicit
      : process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!source) {
    throw new Error(
      "Chiffrement indisponible : définissez CONNECTORS_ENCRYPTION_KEY ou SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  // 32 octets déterministes à partir de la source
  return createHash("sha256").update(source).digest();
}

export function encryptToken(plain: string | null | undefined): string | null {
  if (!plain) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return "v1:" + Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptToken(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith("v1:")) return stored; // rétro-compat / valeur en clair
  const raw = Buffer.from(stored.slice(3), "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}

// Hash d'un jeton MCP (on ne stocke jamais le jeton en clair)
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
