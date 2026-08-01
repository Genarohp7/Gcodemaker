const crypto = require("crypto");

function getKeyBytes(rawKey) {
  const value = String(rawKey || "").trim();

  if (!value) {
    const error = new Error("Clave de cifrado no configurada");
    error.code = "encryption_key_missing";
    throw error;
  }

  if (/^[a-f0-9]{64}$/i.test(value)) {
    return Buffer.from(value, "hex");
  }

  const decoded = Buffer.from(value, "base64");
  if (decoded.length === 32) {
    return decoded;
  }

  const error = new Error("Clave de cifrado invalida");
  error.code = "encryption_key_invalid";
  throw error;
}

function encryptSecret(plainText, rawKey) {
  const value = String(plainText || "");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKeyBytes(rawKey), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decryptSecret(payload, rawKey) {
  const [version, ivText, tagText, encryptedText] = String(payload || "").split(":");
  if (version !== "v1" || !ivText || !tagText || !encryptedText) {
    const error = new Error("Secreto cifrado invalido");
    error.code = "encrypted_secret_invalid";
    throw error;
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getKeyBytes(rawKey),
    Buffer.from(ivText, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagText, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

module.exports = {
  decryptSecret,
  encryptSecret,
};
