ALTER TABLE medicos ADD COLUMN IF NOT EXISTS categoria text CHECK (categoria IN ('Q1','Q2','Q3','Q4'));
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS especialidade text;
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS clinica text;
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES clinicas(id);
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS rotas text[] DEFAULT '{}';
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS dias_visita text[] DEFAULT '{}';
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS disponibilidade jsonb DEFAULT '{}'::jsonb;
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS flags jsonb DEFAULT '{"multiRota":false,"semHorarioFixo":false}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_medicos_rotas ON medicos USING GIN(rotas);
CREATE INDEX IF NOT EXISTS idx_medicos_cidades ON medicos(cidade);
