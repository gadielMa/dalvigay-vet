# Importar el respaldo de ViaFacil

Los respaldos MySQL no se suben al repositorio. Primero se genera un esquema compatible:

```bash
cd /Users/gadiel/dalvigay-vet
node scripts/generar-esquema-legado.mjs \
  /Users/gadiel/Downloads/VETERINARIA/dalvigay_vet_part1.sql \
  /Users/gadiel/Downloads/VETERINARIA/dalvigay_vet_part2.sql \
  /Users/gadiel/Downloads/paciente.sql \
  /Users/gadiel/Downloads/hemogramas.sql \
  /Users/gadiel/Downloads/orina.sql \
  /Users/gadiel/Downloads/parasitos.sql \
  /Users/gadiel/Downloads/notas.sql \
  /Users/gadiel/Downloads/movimientos.sql > /private/tmp/dalvigay-schema.sql
```

Abrí ese archivo, copiá todo su contenido y ejecutalo una vez desde el SQL Editor del proyecto nuevo de Supabase. La tabla `EMPRESA` queda excluida porque el respaldo contiene allí una contraseña histórica de correo.
