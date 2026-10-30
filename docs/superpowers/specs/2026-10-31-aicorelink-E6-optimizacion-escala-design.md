# Diseño — E6: Optimización y Escala (Plan F5 · semanas 9-12)

- **Fecha:** 2026-10-31
- **Estado:** borrador para aprobación
- **Depende de:** E5 (pilotos completado — testimonios, casos con cifras, métricas reales)

---

## 1. Intención

E5 validó el producto con negocios reales y generó prueba social. E6 optimiza el embudo de adquisición, ajusta precios con datos reales y escala la captación mediante SEO local y Meta Ads.

## 2. Alcance

### 2.1 Dentro de E6 (código)
| Requisito | Prioridad | Qué exige |
|---|---|---|
| Casos con cifras en landing | Alta | Sección de casos de éxito con métricas reales de pilotos |
| SEO local | Alta | Páginas por rubro+comuna (SSG/ISR), 3 rubros × 3 comunas mínimo |
| A/B testing titular/CTA | Media | Variantes del hero y CTA con tracking |
| Meta Ads tracking | Media | Pixel + eventos de conversión para click-to-WhatsApp |
| Backlog v1.1 | Media | Documento con prioridades para E7 |

### 2.2 Fuera de E6 (operativo, no código)
- Alianzas y referidos
- SLA de soporte + base de ayuda
- Ajuste de precios (decisión de negocio, no código)

## 3. Arquitectura

### 3.1 SEO Local
Ruta: `/soluciones/[rubro]/[comuna]`
- Generación estática (SSG) con `generateStaticParams`
- Metadata dinámica por rubro+comuna
- Contenido basado en plantilla con variables del rubro
- JSON-LD LocalBusiness

### 3.2 Casos con cifras
Componente `CaseStudiesSection` en la landing que muestra:
- Nombre del negocio (o anónimo)
- Rubro
- Métrica clave (ej: "respondió 3x más mensajes")
- Testimonio corto
- Link a caso completo

### 3.3 A/B Testing
- Middleware que asigna variante (A/B) por cookie
- Componente `HeroVariant` que renderiza titular/CTA según variante
- Tracking de eventos por variante

### 3.4 Meta Ads
- Meta Pixel en layout
- Eventos: Lead, Contact, ViewContent
- UTM tracking ya existente (E1.5)

## 4. Criterios de salida
- Embudo medido con costo/conversión por canal
- Backlog v1.1 priorizado
- ≥ 3 páginas SEO local indexadas
- Casos con cifras publicados en landing