# Análisis de brechas — Panel AicoreLink vs SRD ALK-SRD-001 v2.0

**Fecha:** 2026-10-14
**Fuente de verdad:** `AicoreLink_Web_SRD.pdf` (ALK-SRD-001 v2.0, 11-oct-2026)
**Alcance:** `apps/dashboard` — grupo `(cliente)` (panel del cliente) y grupo `(admin)` (panel interno).
**Veredicto:** el diagnóstico de Leonardo es correcto. El panel del cliente **no implementa M8** y el panel interno está a medias en M9. Hay además defectos de calidad que hacen que el panel parezca un esqueleto de demo.

---

## 1. Inventario de lo existente

### 1.1 Rutas del grupo `(cliente)` — panel del cliente

| Ruta | Archivo | Líneas | Qué hace hoy |
|---|---|---|---|
| `/dashboard` | `app/(cliente)/dashboard/page.tsx` | 373 | "Resumen": 3 tarjetas (tenant falso / canal WhatsApp / métricas del mes) + lista de conversaciones con tabs de filtro |
| `/whatsapp` | `app/(cliente)/whatsapp/page.tsx` | 483 | Configuración del canal WhatsApp en 4 pestañas (General, IA, Escalado, Voz) |
| `/whatsapp/conversaciones` | `app/(cliente)/whatsapp/conversaciones/page.tsx` | s/d | Lista + detalle de conversaciones |

**Navegación del cliente** (`components/cliente/cliente-shell.tsx`, 59 líneas):
`Resumen` · `WhatsApp` · `Email (próximamente)` · `RRSS (próximamente)` · *(Admin si es admin)* · `Cerrar sesión`.

Eso es **todo** lo que el cliente puede ver. No hay marca, ni nombre del negocio, ni rubro, ni plan, ni uso, ni leads, ni citas, ni reseñas, ni soporte, ni facturación.

### Inventario de rutas del grupo `(admin)`

| Ruta | Estado |
|---|---|
| `/tenants` | Operativa pero mínima: tabla Nombre/Slug/Plan/Estado + link "Administrar" |
| `/tenants/[tenantId]` | Operativa |
| `/fabrica` | Operativa y completa (fábrica de sitios E2) |
| `/fabrica/[siteId]` | Operativa (revisión, checklist, versiones, publicar) |
| `/embudo` | Existe, con datos hardcodeados |
| `/infraestructura` | Existe: lee `audit_log` |
| `/metricas` | **Existe la página pero está sin link** (`disabled` en el nav) |

---

## 4. Brechas contra el SRD

### M8 · Panel del cliente y reportes (sección 4.8)

| ID | Requisito del SRD | Prioridad | Estado | Evidencia |
|---|---|---|---|---|
| RF-PAN-01 | Acceso del cliente sin contraseña (código por WhatsApp o magic link) | Alta | **No implementado** | Solo existe login con email+contraseña (`app/login/page.tsx`) |
| RF-PAN-02 | Ver conversaciones, leads, citas y **uso vs límite del plan** | Alta | **Parcial** | Solo hay conversaciones. No hay leads, ni citas, ni uso, ni plan |
| RF-PAN-03 | Editar datos del negocio **y publicar el cambio a su sitio** | Alta | **No implementado** | No hay ninguna acción de publicar desde el panel del cliente |
| RF-PAN-04 | Reporte mensual automático (WhatsApp/email) | Alta | **No implementado** | No hay reportes |
| RF-PAN-05 | Bandeja de solicitudes de soporte con seguimiento | Media | **No implementado** | No hay tickets ni contacto con soporte |

### M9 · Administración interna y multi-tenant (sección 4.9)

| ID | Requisito del SRD | Prioridad | Estado | Evidencia |
|---|---|---|---|---|
| RF-ADM-01 | Lista de tenants con plan, **estado de pago, uso, salud del sitio y del canal**, y alertas de riesgo | Alta | **Incumplido** | `app/(admin)/tenants/page.tsx` (54 líneas): solo Nombre \| Slug \| Plan \| Estado \| Administrar. Sin pago, uso, salud, ni alertas |
| RF-ADM-02 | Aislamiento de datos por tenant | Alta | **No verificado** | Hay RLS `tenant_isolation` en 6 tablas y las de la fábrica, pero no se encontró prueba automatizada de aislamiento |
| RF-ADM-03 | Asistente de onboarding con **checklist por cliente (12–15 pasos)** | Alta | **No implementado** | `onboarding` no aparece en el código. El único checklist es el de revisión de sitios de la fábrica |
| RF-ADM-04 | Roles internos (admin / operador de contenido / soporte lectura) | Media | **No implementado** | Solo hay `role` en `tenant_users` con el valor `dev_aicore`; no hay permisos por rol |
| RF-ADM-05 | Auditoría de acciones sensibles (publicar, cambiar plan, exportar, borrar) | Media | **Parcial** | Existe `lib/audit.ts` y la tabla `audit_log`; se escribe en publish/generation-complete y se lee en `/infraestructura`. No cubre cambio de plan, exportación ni borrado |
| RF-ADM-06 | Integración con `ops.aicorebots.com` | Media | **No implementado** | Sin referencias en el repo |

### M10 · Planes, uso y facturación (sección 4.10)

| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| RF-BIL-01 | Cobro recurrente con pasarela chilena | Alta | No implementado |
| RF-BIL-02 | Medición de uso por tenant con costo estimado | Alta | **Parcial**: existen `tenant_usage` y `cost_rates`, pero solo se muestran en `/dashboard` sin límite de plan |
| RF-BIL-03 | Alertas de margen | Alta | No implementado |
| RF-BIL-04 | Boleta/factura electrónica | Alta | No implementado |
| RF-BIL-05 | Cambio de plan con prorrateo | Media | No implementado |
| RF-BIL-06 | Cancelación con exportación de contenido | Alta | No implementado |
| RF-BIL-07 | Pasarela de pago (Flow / Mercado Pago / Transbank) | Alta | **Pendiente de decisión** |

### M11 · Analítica y atribución (sección 4.11)

| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| RF-ANA-01 | Eventos: visita, scroll, clic WhatsApp, formulario, test, calculadora | Alta | **Parcial** |
| RF-ANA-02 | Atribución UTM por lead y por sesión | Alta | **Parcial**: `landing_leads` guarda utm_*, pero no hay panel que lo muestre |
| RF-ANA-03 | A/B test de titular | Media | No implementado |
| RF-ANA-04 | Tablero de embudo visitas → leads → calificados → citas → clientes | Media | **No cumple**: `/embudo` tiene las etapas hardcodeadas (líneas 10, 61, 122), no se alimenta de datos |
| RF-ANA-05 | Exportación CSV | Media | No implementado |

### Secciones 5 y 7 · Diseño y no funcionales

| ID | Requisito | Estado | Evidencia |
|---|---|---|---|
| RD-08 | Estados de error y vacío bien resueltos | **Incumplido** | El panel vacío muestra un spinner infinito |
| RD-09 | Consistencia de componentes entre webs | **Incumplido** | La página del panel implementa su propia navegación, duplicando el layout |
| RD-12 | Accesibilidad WCAG AA | No verificado | Sin auditoría |
| RN-03 | Secretos fuera del código, mínimo privilegio, rotación | **Alerta** | Se encontraron env vars prefijadas `AICORELINK_*` sin uso y un endpoint público de verificación de contraseña (ya eliminado) |

---

## 5. Defectos de calidad (bugs concretos)

Estos son los que dan la sensación de que "el dashboard está mal hecho":

1. **Nombre de tenant hardcodeado.** `app/(cliente)/dashboard/page.tsx:167` muestra `Clínica Demo` literal, y el plan `Pro` también. El cliente real vería el nombre de otra empresa.
2. **Código generado sin sentido.** Línea 175:
   `["font-medium", "text-green-600", "activo" === "activo" ? "text-green-600" : "text-red-500"]`
   compara un literal consigo mismo ⇒ el estado siempre verde, nunca puede fallar.
3. **Locale argentino.** Línea 156: `new Date().toLocaleDateString("es-AR")` en un producto pensado para Chile.
4. **Doble navegación.** El layout `(cliente)` ya dibuja la sidebar, y la página agrega su propia `<nav>` con logo y "Panel de control". Se ve dos veces.
5. **La lista de mensajes no existe.** `loadMessages()` es un no-op explícito ("In a full implementation, this would fetch messages..."): no hay forma de ver una conversación.
6. **Spinner eterno.** Los estados de carga y de vacío renderizan el mismo `animate-spin`, así que en el vacío gira para siempre.
7. **`Cerrar sesión` duplicado.** `app/(cliente)/whatsapp/page.tsx` repite el botón que ya está en la sidebar, además de su propio `<h1>WhatsApp</h1>`.
8. **Copy clínico heredado.** En `whatsapp/page.tsx` hay "La clínica abre de lunes a viernes 9 a 18hs. Dirección: Av. Siempre Viva 123. Servicios: Clínica general, Pediatría, Cardiología...", y se habla de "pacientes" y "staff". Es el producto anterior, no el catálogo de rubros actual.
9. **Ruta muerta.** `/metricas` existe y está marcada `disabled` en el menú: no accesible desde ningún lado.
10. **Embudo decorativo.** `/embudo` muestra etapas fijas que no dependen de datos reales.

---

## 6. Lectura general

El panel admin **sí** tiene una pieza real y bien hecha: la fábrica de sitios (`/fabrica`, `/fabrica/[siteId]`) con checklist, versiones y publicación.

El panel del cliente, en cambio, es **una maqueta**: una sola pantalla con datos falsos, un no-op y un spinner infinito; más un formulario de configuración con copy del proyecto anterior.

Contra el SRD, hoy faltan **M8 completo** (los 5 requisitos), **RF-ADM-01** y **RF-ADM-03** (los dos de prioridad Alta de M9), y todo M10.

---

## 7. Plan propuesto (por impacto y orden de dependencia)

### Fase A — Reparaciones de calidad (sin nuevas funcionalidades)
Hacer que lo que existe no mienta: quitar `Clínica Demo`, `Pro`, la comparación absurda y el `es-AR`; eliminar la navegación duplicada y el `Cerrar sesión` de la página; arreglar el spinner de los estados vacíos; matar `/metricas` o dejarla funcional; limpiar el copy clínico y hablar de "negocio" y "clientes".
**Resultado:** el panel deja de verse roto.

### Fase B — M8 mínimo (RF-PAN-02)
Una pantalla de inicio real para el cliente, con su nombre, rubro, plan, uso del mes y límites, leads y conversaciones recientes.
**Dependencia:** conocer el contrato de `/api/tenants/*`.

### Fase C — M9 Alta (RF-ADM-01)
Lista de tenants con salud, uso, pago y alertas de riesgo, alimentada por datos reales.
**Dependencia:** de dónde sale "estado de pago" (hoy no hay M10).

### Fase D — M9 Alta (RF-ADM-03)
Asistente de onboarding con checklist de 12–15 pasos y estado por cliente.

### Fase E — M11 y `/embudo`
Embridar los flujos de leads y UTM para que el embudo y las métricas se alimenten de datos reales en vez de constantes.

### Fase F — M10
Depende de una decisión de negocio: qué pasarela (RF-BIL-07).

---

## 8. Decisiones que necesito de Leonardo

1. **¿Qué pantalla es la primera que el cliente debe ver al entrar?** Hoy aterriza en `/whatsapp` y el "Resumen" es `/dashboard`.
2. **¿Fase A primero** (reparar lo visible y después construir) o directamente Fase B?
3. **RF-BIL-07: pasarela de pago.** Sin es decisión, M10 no se puede planificar.
4. RF-PAN-01: ¿código por WhatsApp o magic link por email?
