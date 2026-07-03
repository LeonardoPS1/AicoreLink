---
name: frontend
description: >-
  Guía de desarrollo frontend para AicoreLink: Next.js 14 App Router, Server Components, Tailwind CSS,
  layout system, y buenas prácticas de componentes.
---

## Uso

Incluye `@frontend` al inicio de cualquier prompt relacionado con el frontend del dashboard.

## Stack frontend

- Next.js 14 (App Router) con Server Components por defecto
- TypeScript estricto
- Tailwind CSS para estilos (sin CSS modules ni styled-components)
- `font-sans` de Geist (Next.js built-in)

## Convenciones

- Siempre usar `export const dynamic = "force-dynamic"` en layouts/pages que consulten datos por tenant
- Los componentes de UI son Server Components a menos que necesiten interactividad
- Para interactividad: usar Client Components con `"use client"` solo donde sea necesario
- Las rutas están agrupadas en Route Groups: `(admin)` para panel de administración, `(cliente)` para panel de clientes

## Route Groups

```
app/
├── (admin)/
│   ├── layout.tsx        # layout admin (sidebar Aicore Agency)
│   ├── tenants/
│   └── page.tsx          # overview admin
├── (cliente)/
│   ├── layout.tsx        # layout cliente (sidebar de módulos del tenant)
│   ├── dashboard/
│   └── ...canales
├── login/
├── api/
└── page.tsx              # landing/redirect según sesión
```

## Tailwind

- Colores definidos en `tailwind.config.ts`
- Patrones existentes: `bg-navy`, `bg-brand`, `text-teal`, `text-navy`
- Usar arbitary values solo cuando no haya un token definido
- Preferir la paleta de Tailwind (`slate-50`, `slate-900`, etc.) antes de agregar colores custom

## Buenas prácticas

- No importar datos directamente en layouts que envuelvan rutas protegidas (los layouts no tienen acceso a la sesión)
- Usar Server Components para fetching de datos, Client Components solo para eventos de usuario
- Los íconos deben ser SVG inline o Lucide React (no emojis)
- Las páginas que consultan datos de DB deben marcar `export const dynamic = "force-dynamic"`
