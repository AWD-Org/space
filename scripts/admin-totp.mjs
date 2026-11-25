// Genera el secreto TOTP del admin de Space. Se corre una sola vez, en tu computadora:
//   node scripts/admin-totp.mjs [correo]
// Escanea el QR con Google Authenticator y pon el secreto en Netlify como ADMIN_TOTP_SECRET.
// El secreto NO se guarda en el repo ni se manda por chat.
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";

const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function b32(buf) {
  let bits = 0, v = 0, out = "";
  for (const b of buf) {
    v = (v << 8) | b; bits += 8;
    while (bits >= 5) { out += A[(v >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += A[(v << (5 - bits)) & 31];
  return out;
}
const email = process.argv[2] || "space@amoxtli.tech";
const secret = b32(randomBytes(20));
const uri = `otpauth://totp/${encodeURIComponent(`Space Admin:${email}`)}?secret=${secret}&issuer=${encodeURIComponent("Space Admin")}&algorithm=SHA1&digits=6&period=30`;
console.log("\nEscanea este QR con Google Authenticator:\n");
console.log(await QRCode.toString(uri, { type: "terminal", small: true }));
console.log("Secreto (por si prefieres escribirlo a mano):", secret);
console.log("\nVariables para Netlify (contexto dev):");
console.log(`  ADMIN_TOTP_SECRET=${secret}`);
console.log(`  SUPERADMIN_EMAILS=${email}\n`);
console.log("Para recuperar el acceso si pierdes el celular: genera otro secreto y cambia la variable.\n");
