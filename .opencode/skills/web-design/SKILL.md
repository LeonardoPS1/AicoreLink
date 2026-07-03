---
name: web-design
description: >-
  Guía de diseño UI/UX para AicoreLink: Tailwind CSS, layouts responsivos, paleta de colores, accesibilidad,
  y patrones de interfaz para dashboards multi-tenant.
---

## Uso

Incluye `@web-design` al inicio de cualquier prompt relacionado con diseño de interfaz.

## Paleta de colores

| Token | Uso |
|---|---|
| `bg-navy` / `text-navy` | Sidebar cliente, navegación |
| `bg-slate-900` | Sidebar admin |
| `bg-slate-50` | Fondo de contenido |
| `text-brand` | Links y acciones primarias |
| `text-teal` | Estados activos/positivos |
| `text-slate-400/500` | Texto secundario, placeholders |

## Layout system

```
┌──────────────────────────────────────────────┐
│ Sidebar (60-240px) │    Main Content (flex-1) │
│   bg-navy/slate-900 │      bg-slate-50        │
│   text-white         │                        │
│                     │                        │
│ Logo + Nombre       │   Breadcrumb / Session │
│ Nav links           │                        │
│                     │   {children}           │
│                     │                        │
└──────────────────────────────────────────────┘
```

## Responsive

- Sidebar fijo en desktop (`w-60 shrink-0`)
- Sidebar colapsable en mobile (Fase futura)
- Tablas con overflow-x scroll en mobile
- Grid responsivo: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`

## Estados de UI

- **Activo**: `text-teal` + badge verde
- **Inactivo/No contratado**: `text-slate-400` + badge gris
- **Loading**: skeleton con `animate-pulse`
- **Empty state**: texto en `text-slate-400` + ícono opcional

## Tablas

```html
<div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
  <table class="w-full text-sm">
    <thead class="bg-slate-100 text-left text-xs uppercase text-slate-500">
      <tr>
        <th class="px-4 py-3">Nombre</th>
        ...
      </tr>
    </thead>
    <tbody>
      <tr class="border-t border-slate-100">
        <td class="px-4 py-3 font-medium">...</td>
        ...
      </tr>
    </tbody>
  </table>
</div>
```

## Buenas prácticas

- No usar emojis en la interfaz
- Los links a features no implementadas deben tener clase `opacity-50`
- Usar `text-xs uppercase text-slate-400` para labels de formularios y headers de tabla
- Los botones de acción primaria deben usar `bg-brand text-white` con `hover:` state
- Mantener consistencia: si un patrón existe, reutilizarlo (no crear uno nuevo similar)
