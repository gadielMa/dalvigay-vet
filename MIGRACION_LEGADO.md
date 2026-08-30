# Consolidación en Dalvigay Vet

`dalvigay-vet` reemplaza a los proyectos `cediapvet` y `dalvigay`.

## Qué queda consolidado

- Fichas históricas: clientes, pacientes, historias clínicas, vacunas, análisis, ecografías y rayos X provienen de las tablas ya migradas a Supabase.
- Operación diaria: inventario, ventas y comunicaciones por email se incorporan con la migración `supabase/migrations/20260829_operacion.sql`.
- Recordatorios de vacunas: continúan usando Resend desde la app actual.

No se migran contraseñas, usuarios de ejemplo ni el proveedor SMS legado. Los usuarios siguen siendo `ta_usuarios`; las contraseñas antiguas en texto plano se convierten a bcrypt al iniciar sesión.

## Puesta en producción

1. Hacer un respaldo exportable de la base PostgreSQL antigua y de Supabase.
2. Ejecutar la migración SQL en el SQL Editor de Supabase.
3. Configurar todas las variables de `.env.example` en Render. `AUTH_SECRET` debe ser nuevo y único.
4. Desplegar esta versión y probar: login, consultas históricas, alta de inventario, venta y envío de recordatorio.
5. Exportar los datos que aún existan exclusivamente en el PostgreSQL legado e importarlos con un script revisado, conservando los IDs de referencia cuando corresponda.
6. Recién entonces desactivar Railway/Vercel antiguos, volver privados los repositorios viejos y eliminar la información sensible de su historial.

No borres los repositorios antes de completar los pasos 1 a 5: son la única fuente de recuperación del esquema y de datos no migrados.
