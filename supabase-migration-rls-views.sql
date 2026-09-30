-- ============================================
-- Migración: RLS en vistas (security_invoker)
-- Ejecutar en: Supabase SQL Editor
-- Corregir el aviso del linter de Supabase:
--   "View public.v_stock_actual is defined with the SECURITY DEFINER property"
--
-- Por defecto las vistas en Postgres son SECURITY DEFINER: se ejecutan con
-- los permisos de su creador y saltean el RLS del usuario que consulta.
-- Con security_invoker = true la vista respeta las políticas RLS de las
-- tablas base según el usuario que consulta.
--
-- Impacto verificado:
--   - Admin (sesión autenticada): sigue viendo sólo sus filas (RLS por usuario_id
--     en productos, movimientos_stock, ventas_items y kit_items).
--   - Tienda pública: usa service_role (bypass RLS), sin cambios.
-- ============================================

ALTER VIEW public.v_stock_actual SET (security_invoker = true);

-- IMPORTANTE: si una migración futura recrea la vista con
-- DROP VIEW + CREATE VIEW (p. ej. al agregar columnas), volver a aplicar
-- esta línea después, porque el DROP pierde la opción.

-- ============================================
-- FIN
-- ============================================
