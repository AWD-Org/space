# Space

Catálogo digital gratis para vender por WhatsApp. Subes lo que vendes, compartes un link y los pedidos llegan armados al chat. Hecho por [AMOXTLI®](https://amoxtli.tech). En producción: https://space.amoxtli.tech

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · Firebase (Auth, Firestore, Storage) con `firebase-admin` solo en el servidor.

## Cómo funciona

- Entrada con Google o correo. El navegador obtiene un ID token de Firebase y `/api/session` lo cambia por una cookie de sesión (`__session`, 14 días).
- Firestore y Storage no aceptan escrituras del cliente (`firestore.rules`, `storage.rules`). Todo pasa por acciones de servidor que toman la tienda desde la sesión.
- Los límites del plan gratis viven en `lib/plan.ts` y se pueden cambiar sin desplegar con el documento `config/plan_free`. Se validan dentro de transacciones.
- Las fotos se comprimen en el navegador (WebP, 1600 px) y se suben por `/api/upload`.
- El pedido se arma en una bolsa del lado del cliente y se envía con un link `wa.me`.
- Cobro con Stripe apagado (`NEXT_PUBLIC_BILLING_ENABLED=false`). El código anterior sigue en el historial de git.

## Variables de entorno

Copia `.env.example`. En Netlify, agrégalas en Production y Preview.

| Variable | De dónde sale |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://space.amoxtli.tech` |
| `NEXT_PUBLIC_FIREBASE_*` | Configuración del proyecto > Tus apps (web) |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | JSON de la cuenta de servicio. Nunca se sube al repositorio ni se comparte por chat. |

`FIREBASE_PRIVATE_KEY` acepta los saltos de línea escapados (`\n`).

## Puesta en marcha de Firebase

1. Authentication: activar Correo/contraseña y Google; agregar `space.amoxtli.tech` en dominios autorizados.
2. Crear Firestore y Storage.
3. Publicar las reglas: `firebase deploy --only firestore:rules,storage` (usa `firebase.json`).
4. Si Firestore pide un índice compuesto, el error trae el enlace para crearlo.

## Desarrollo

```bash
npm install
npm run dev
```

Sin Firebase, define `NEXT_PUBLIC_SPACE_LOCAL_MODE=1` para usar datos locales en `.local-data/` y una sesión simulada. No lo uses en producción.

```bash
npm run type-check
npm run build
```
