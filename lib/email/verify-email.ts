import "server-only";
import { SITE_URL } from "@/lib/env";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export const resendConfigured = () => Boolean(process.env.RESEND_API_KEY);

/** Plantilla de confirmación de correo: tablas y estilos en línea para que se vea igual en todos los clientes. */
export function verificationEmail(name: string | null, link: string) {
  const hello = name ? `Hola, ${esc(name.split(" ")[0])}` : "Hola";
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#F4F6FF;font-family:Helvetica,Arial,sans-serif;color:#0B1030">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6FF;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:20px;padding:36px 32px">
<tr><td style="font-size:22px;font-weight:700;letter-spacing:-0.01em;color:#3B55E6">Space</td></tr>
<tr><td style="padding-top:24px;font-size:24px;line-height:1.25;font-weight:700">${hello}, confirma tu correo</td></tr>
<tr><td style="padding-top:12px;font-size:16px;line-height:1.55;color:#3A4160">Con esto protegemos tu espacio y podemos avisarte si algo importa. Toma un segundo.</td></tr>
<tr><td style="padding-top:28px"><a href="${esc(link)}" style="display:inline-block;background:#3B55E6;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 26px;border-radius:999px">Confirmar mi correo</a></td></tr>
<tr><td style="padding-top:28px;font-size:13px;line-height:1.5;color:#6B7194">Si el botón no abre, copia este enlace en tu navegador:<br><span style="word-break:break-all;color:#3B55E6">${esc(link)}</span></td></tr>
<tr><td style="padding-top:24px"><div style="border-top:1px solid #E9ECFF;height:1px;line-height:1px;font-size:1px">&nbsp;</div></td></tr>
<tr><td style="padding-top:16px;font-size:12px;line-height:1.5;color:#6B7194">Si no creaste una cuenta en Space, ignora este mensaje y no pasará nada.</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px"><tr><td align="center" style="padding-top:16px;font-size:12px;color:#6B7194">Space · <a href="${SITE_URL}" style="color:#6B7194">${SITE_URL.replace(/^https?:\/\//, "")}</a></td></tr></table>
</td></tr></table></body></html>`;
  const text = `${hello}, confirma tu correo en Space.\n\nAbre este enlace: ${link}\n\nSi no creaste una cuenta, ignora este mensaje.`;
  return { subject: "Confirma tu correo en Space", html, text };
}

export async function sendVerificationEmail(to: string, name: string | null, link: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY no está configurada.");
  const { subject, html, text } = verificationEmail(name, link);
  const res = await fetch(`${process.env.RESEND_API_URL || "https://api.resend.com"}/emails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.RESEND_FROM || "Space <space@amoxtli.tech>", to: [to], subject, html, text }),
  });
  if (!res.ok) throw new Error(`Resend respondió ${res.status}`);
}
