-- Full-Text Search (Etapa 8)
-- Índice GIN de expressão alinhado exatamente à expressão de filtro (WHERE)
-- da consulta existente em src/services/search.service.js:
--   to_tsvector('portuguese', coalesce(c.titulo, '') || ' ' || coalesce(c.descricao, ''))
-- Sem nova coluna no schema Prisma e sem tocar na migration inicial.
CREATE INDEX "Chamado_fts_idx"
  ON "Chamado"
  USING GIN (to_tsvector('portuguese', coalesce("titulo", '') || ' ' || coalesce("descricao", '')));
