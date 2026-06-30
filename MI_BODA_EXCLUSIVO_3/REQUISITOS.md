# Requisitos del Proyecto — Sitio RSVP Boda Sofía & Alejandro 2026

## Requisitos Funcionales (RF)

| # | Requisito |
|---|---|
| RF01 | El sistema debe permitir a los invitados confirmar asistencia (RSVP) mediante un formulario multi-paso (asiste sí/no → datos personales → acompañantes/menú → confirmación). |
| RF02 | El sistema debe generar un código QR único por invitado como comprobante de confirmación. |
| RF03 | El sistema debe mostrar un contador en tiempo real (countdown) hacia la fecha del evento. |
| RF04 | El sistema debe presentar información del evento: ubicación, cronograma, código de vestimenta, galería de fotos, mesa de regalos. |
| RF05 | El sistema debe reproducir música de fondo configurable. |
| RF06 | El sistema debe contar con un panel administrativo protegido por login (usuario/contraseña). |
| RF07 | El panel admin debe permitir CRUD completo de invitados (alta, edición, baja, listado, búsqueda/filtro). |
| RF08 | El panel admin debe mostrar estadísticas y gráficos (Chart.js): confirmados, pendientes, rechazados, por grupo y por tipo de menú. |
| RF09 | El sistema debe permitir exportar la lista de invitados en CSV, PDF, JSON y Excel (XLSX). |
| RF10 | El sistema debe permitir diseñar el plano del salón: ubicar mesas, decoración y elementos mediante arrastrar y soltar (drag & drop), con zoom e impresión. |
| RF11 | El sistema debe permitir gestionar el cronograma del evento (crear/editar/eliminar actividades con hora). |
| RF12 | El sistema debe permitir configurar datos generales de la boda (fecha, nombres de los novios, lugar, sillas por mesa) desde el panel admin. |
| RF13 | El sistema debe validar los campos del formulario de RSVP antes de procesarlos. |
| RF14 | El panel admin debe soportar modo claro/oscuro. |

## Requisitos No Funcionales (RNF)

| # | Requisito |
|---|---|
| RNF01 | **Disponibilidad:** el sitio debe estar accesible 24/7 mediante despliegue en la nube (Render). |
| RNF02 | **Usabilidad:** interfaz responsiva, adaptable a móvil, tablet y escritorio. |
| RNF03 | **Rendimiento:** las animaciones (partículas, pétalos, parallax, confetti) no deben degradar la fluidez en dispositivos de gama media. |
| RNF04 | **Seguridad:** el panel admin debe estar restringido por autenticación; los datos sensibles no se exponen en el frontend público. |
| RNF05 | **Mantenibilidad:** separación de responsabilidades en el código (`main.js` sitio público, `admin.js` panel, CSS independiente por vista). |
| RNF06 | **Portabilidad:** el servidor debe ejecutarse en cualquier entorno con Node.js ≥ 18 (requisito declarado en `package.json`). |
| RNF07 | **Escalabilidad de datos:** capacidad de migrar la persistencia de `localStorage` a una base de datos centralizada en la nube (Neon/PostgreSQL) para soportar múltiples usuarios/dispositivos. |
| RNF08 | **Compatibilidad:** soporte en navegadores modernos (Chrome, Firefox, Edge). |
| RNF09 | **Despliegue continuo:** integración Git/GitHub → Render para publicar cambios sin intervención manual en el servidor. |

## Infraestructura

- **Render:** hosting/despliegue del servidor Express (`server.js`) que sirve los archivos estáticos del sitio (`index.html`, `admin.html`, CSS/JS). Build automático desde el repositorio de GitHub.
- **Neon (PostgreSQL en la nube, serverless):** base de datos prevista/usada para persistencia centralizada de invitados, configuración del evento y cronograma, como evolución del actual `localStorage`.

## Herramientas utilizadas

| Herramienta | Uso en el proyecto |
|---|---|
| **Visual Studio Code** | Editor/IDE principal de desarrollo (HTML, CSS, JS, Node). |
| **Git** | Control de versiones local. |
| **GitHub** | Repositorio remoto, historial de commits, integración con Render. |
| **DataGrip** | Diseño, administración y consulta del esquema de base de datos (PostgreSQL/Neon). |
| **Draw.io** | Diagramación: diagramas de flujo, entidad-relación y/o arquitectura del sistema. |
| **Render** | Plataforma de despliegue/hosting en la nube. |
| **Neon** | Base de datos PostgreSQL administrada en la nube. |
