---
description: Creá una migración SQL de Supabase con la convención del repo y checklist RLS
agent: build
---

Creá una migración SQL para el cambio de base de datos pedido:

$ARGUMENTS

Reglas (ver `SUPABASE_MIGRATIONS.md`):

1. Archivo nuevo en la raíz: `supabase-migration-<tema>.sql` (kebab-case, tema corto).
2. Encabezado con propósito y nota de que se corre a mano en Supabase SQL Editor.
3. Sólo cambios **aditivos** cuando sea posible (`ADD COLUMN IF NOT EXISTS`, `CREATE ... IF NOT EXISTS`).
   Si reemplazás una vista, usá `DROP VIEW IF EXISTS` antes (no permite agregar columnas con `CREATE OR REPLACE`).
4. **RLS**: por cada tabla tocada, verificá que estén las políticas de la operación usada
   (SELECT / INSERT / **UPDATE** / DELETE) con `auth.uid() = usuario_id`. Que exista SELECT/INSERT no alcanza.
5. Si cambiás una tabla con datos, considerá valores por defecto y compatibilidad.
6. Al terminar, listá en la entrega: **la migración creada** y **que el humano la tiene que correr** en Supabase.
7. Si el cambio afecta stock/dinero/estados, recordá los ajustes correspondientes en los endpoints.

No apliques la migración vos; el repo no tiene runner (se ejecuta a mano).
