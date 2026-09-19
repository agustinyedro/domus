-- ============================================
-- SEED: 24 productos DOMUS (Sagrada Madre / Aromanza)
-- Ejecutar en: Supabase SQL Editor
-- Precios de lista = COSTO · precio_venta = costo x 2
-- Sin stock inicial (cargar desde /admin/compras).
-- Re-ejecutable: ON CONFLICT (sku) DO NOTHING.
-- ============================================

-- Verificar usuario antes (debe devolver 1 fila):
-- SELECT id FROM auth.users WHERE email = 'domusencasa@gmail.com';

WITH mi_usuario AS (
  SELECT id FROM auth.users WHERE email = 'domusencasa@gmail.com'
)
INSERT INTO productos (usuario_id, sku, nombre, categoria, costo, precio_venta, stock_minimo, activo)
SELECT
  mi_usuario.id, v.sku, v.nombre, v.categoria, v.costo, v.costo * 2, 5, true
FROM mi_usuario CROSS JOIN (VALUES
  ('TAO-CONOS-CITRONELLA', 'Conos Línea TAO Citronella/Antimosquito', 'Sahumerios', 908),
  ('P724677-FLORAL', 'Difusor Aromanza 60 ML (Mix Floral)', 'Difusores', 3664),
  ('P724677-OCEAN', 'Difusor Aromanza 60 ML (Ocean Blue)', 'Difusores', 3664),
  ('P1827031', 'Difusor para Autos Aromanza (Hawaian)', 'Difusores', 3157),
  ('P1110837-ARMONIA', 'Kit Humito Sagrado - Sagrada Madre (Armonia)', 'Sahumerios', 1799),
  ('P1110837-PROSPERIDAD', 'Kit Humito Sagrado - Sagrada Madre (Prosperidad)', 'Sahumerios', 1799),
  ('P1110837-PURIFICACION', 'Kit Humito Sagrado - Sagrada Madre (Purificación)', 'Sahumerios', 1799),
  ('P1155761', 'Rocío Áurico Protector Personal (Protección Energética)', 'Aromas', 1598),
  ('P1070002-PALOSANTO', 'Sahumerio Línea TAO Natural - Sagrada Madre (Palo Santo Rosa Mosqueta)', 'Sahumerios', 784),
  ('P1070002-SANDALO', 'Sahumerio Línea TAO Natural - Sagrada Madre (Sándalo)', 'Sahumerios', 784),
  ('P722714', 'Sahumerio Mini Tibetano (Esencia de la India)', 'Sahumerios', 1833),
  ('TAROT-GERANIUM', 'Sahumerio Tarot Ángeles - Sagrada Madre (Geranium Berries - Protector)', 'Sahumerios', 2338),
  ('P722013-CITRONELA', 'Sahumerio Tibetano (Citronela Antimosquito)', 'Sahumerios', 2345),
  ('P722013-DIAMANTE', 'Sahumerio Tibetano (Diamante Negro Aquí y Ahora)', 'Sahumerios', 2345),
  ('P722013-INDIA', 'Sahumerio Tibetano (Esencia de la India Humildad)', 'Sahumerios', 2345),
  ('P722013-INCIENSO', 'Sahumerio Tibetano (Incienso Consagrado Iluminación)', 'Sahumerios', 2345),
  ('P722013-NARANJA', 'Sahumerio Tibetano (Naranja Pimienta Atracción)', 'Sahumerios', 2345),
  ('P722013-REINA', 'Sahumerio Tibetano (Reina de la Noche Generosidad)', 'Sahumerios', 2345),
  ('P722013-YAGRA', 'Sahumerio Tibetano (Yagra de la Abundancia Prosperidad)', 'Sahumerios', 2345),
  ('P2651805', 'Sahumerios Oráculos (Oráculo de la Sabiduría)', 'Sahumerios', 2683),
  ('P2818959-JAZMIN', 'Vela Aromática Premium Aromanza (Jazmín del País)', 'Velas', 8691),
  ('P2818959-INDIA', 'Vela Aromática Premium Aromanza (Esencia de la India)', 'Velas', 8691),
  ('P2854942-LAVANDA', 'Velas de Noche Aromáticas x10 Uni (Lavanda del Valle)', 'Velas', 3955),
  ('P2854942-NARANJA', 'Velas de Noche Aromáticas x10 Uni (Naranja Pimienta)', 'Velas', 3955)
) AS v(sku, nombre, categoria, costo)
ON CONFLICT (sku) DO NOTHING;

-- Verificación: debe devolver 24 (o más si ya había productos)
-- SELECT count(*) FROM productos WHERE sku LIKE 'P%' OR sku IN ('TAO-CONOS-CITRONELLA', 'TAROT-GERANIUM');
