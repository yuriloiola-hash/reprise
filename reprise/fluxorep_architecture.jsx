import { useState } from "react";

const TABS = [
  { id: "sql", label: "1 · Schema SQL", icon: "ti-database" },
  { id: "status", label: "2 · Lógica de Status", icon: "ti-palette" },
  { id: "offline", label: "3 · Sincronização Offline", icon: "ti-wifi-off" },
  { id: "deeplink", label: "4 · Deep Link GPS", icon: "ti-map-pin" },
];

const sqlCode = `-- ============================================================
-- FluxoREP · Schema Supabase
-- ============================================================

-- ENUM: Categorias de médico
CREATE TYPE categoria_cat AS ENUM ('CAT1','CAT2','CAT3','CAT4','MARCAS_CHAVE');

-- ENUM: Status de visita
CREATE TYPE status_visita AS ENUM ('PLANEJADO','PRE_FEITA','POS_FEITA','ATRASADO');

-- ============================================================
-- Tabela: locais_complexos  (lookup dinâmico)
-- Permite cadastrar novos bairros/edifícios sem duplicatas
-- ============================================================
CREATE TABLE locais_complexos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL UNIQUE,       -- Ex: "Shopping RioMar" / "Aldeota"
  tipo        TEXT CHECK (tipo IN ('BAIRRO','EDIFICIO','SHOPPING','OUTRO')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Tabela: clinicas  (lookup dinâmico)
-- ============================================================
CREATE TABLE clinicas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT NOT NULL,
  google_place_id TEXT UNIQUE,            -- identificador canônico do complexo
  complexo_id     UUID REFERENCES locais_complexos(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Tabela: medicos
-- ============================================================
CREATE TABLE medicos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  nome            TEXT NOT NULL,
  crm             TEXT UNIQUE,
  especialidade   TEXT NOT NULL,

  -- Categorização
  categoria_cat   categoria_cat NOT NULL DEFAULT 'CAT3',
  marcas_chave    BOOLEAN NOT NULL DEFAULT FALSE,  -- alto potencial

  -- Localização granular
  google_place_id TEXT,             -- Place ID do endereço principal
  clinica_id      UUID REFERENCES clinicas(id) ON DELETE SET NULL,
  clinica         TEXT,             -- nome da clínica específica (livre)
  local_complexo  TEXT,             -- bairro OU nome do edifício/complexo
  complexo_id     UUID REFERENCES locais_complexos(id) ON DELETE SET NULL,
  sala_andar      TEXT,             -- ex: "Sala 304 · 3º Andar"

  -- Contato
  telefone        TEXT,
  email           TEXT,

  -- Metadados
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  rep_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para agrupamento de roteiros por complexo/bairro
CREATE INDEX idx_medicos_local_complexo  ON medicos (local_complexo);
CREATE INDEX idx_medicos_complexo_id     ON medicos (complexo_id);
CREATE INDEX idx_medicos_google_place_id ON medicos (google_place_id);
CREATE INDEX idx_medicos_categoria       ON medicos (categoria_cat);
CREATE INDEX idx_medicos_rep_ativo       ON medicos (rep_id, ativo);

-- ============================================================
-- Tabela: visitas
-- ============================================================
CREATE TABLE visitas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id           UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  rep_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Datas e horários
  data_planejada      DATE NOT NULL,
  hora_planejada      TIME,
  pre_visita_at       TIMESTAMPTZ,    -- NULL = não feita
  pos_visita_at       TIMESTAMPTZ,    -- NULL = não feita

  -- Flags derivadas (calculadas pelo app, usadas para queries rápidas)
  pre_visita_feita    BOOLEAN NOT NULL DEFAULT FALSE,
  pos_visita_feita    BOOLEAN NOT NULL DEFAULT FALSE,
  status              status_visita NOT NULL DEFAULT 'PLANEJADO',

  -- Conteúdo da pós-visita
  objetivo            TEXT,
  resultado           TEXT,
  proxima_acao        TEXT,
  produtos_abordados  TEXT[],

  -- Sincronização offline
  sync_id             TEXT UNIQUE,    -- UUID gerado no cliente (idempotência)
  synced_at           TIMESTAMPTZ,    -- NULL = ainda offline / pendente
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_visitas_medico      ON visitas (medico_id);
CREATE INDEX idx_visitas_rep_data    ON visitas (rep_id, data_planejada);
CREATE INDEX idx_visitas_status      ON visitas (status);
CREATE INDEX idx_visitas_sync        ON visitas (sync_id) WHERE synced_at IS NULL;

-- ============================================================
-- Tabela: insights  (notas qualitativas)
-- ============================================================
CREATE TABLE insights (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visita_id   UUID NOT NULL REFERENCES visitas(id) ON DELETE CASCADE,
  medico_id   UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  rep_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo        TEXT CHECK (tipo IN ('OBJECAO','OPORTUNIDADE','PREFERENCIA','FOLLOW_UP','GERAL')),
  conteudo    TEXT NOT NULL,
  sync_id     TEXT UNIQUE,
  synced_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insights_medico  ON insights (medico_id);
CREATE INDEX idx_insights_visita  ON insights (visita_id);

-- ============================================================
-- Trigger: atualiza updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER trg_medicos_updated_at
  BEFORE UPDATE ON medicos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_visitas_updated_at
  BEFORE UPDATE ON visitas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- RLS: cada rep só vê seus próprios dados
-- ============================================================
ALTER TABLE medicos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rep_own_medicos"  ON medicos  FOR ALL USING (rep_id = auth.uid());
CREATE POLICY "rep_own_visitas"  ON visitas  FOR ALL USING (rep_id = auth.uid());
CREATE POLICY "rep_own_insights" ON insights FOR ALL USING (rep_id = auth.uid());`;

const statusCode = `// ============================================================
// FluxoREP · Lógica de Status de Visita
// Arquivo: lib/visitStatus.js
// ============================================================

/** Cores canônicas do FluxoREP */
export const VISIT_COLORS = {
  PLANEJADO: { hex: '#94A3B8', label: 'Planejado',  tailwind: 'bg-slate-400'  },
  PRE_FEITA: { hex: '#3B82F6', label: 'Pré-visita', tailwind: 'bg-blue-500'  },
  POS_FEITA: { hex: '#22C55E', label: 'Concluído',  tailwind: 'bg-green-500' },
  ATRASADO:  { hex: '#EF4444', label: 'Atrasado',   tailwind: 'bg-red-500'   },
};

/**
 * Calcula o status de uma visita com base nas regras de negócio.
 *
 * Regras:
 *  - Pós-visita feita                       → VERDE  (POS_FEITA)
 *  - Pré-visita feita, mas não pós          → AZUL   (PRE_FEITA)
 *  - Nenhuma feita, prazo ainda não venceu  → NEUTRO (PLANEJADO)
 *  - Pós-visita não feita e já passou 18h
 *    no dia planejado                       → VERMELHO (ATRASADO)
 *
 * @param {Object}  params
 * @param {Date}    params.dataPlanejada   - Dia da visita planejada
 * @param {boolean} params.preVisitaFeita
 * @param {boolean} params.posVisitaFeita
 * @param {Date}   [params.agora]          - Injeção de dependência (testes)
 * @returns {{ status: string, hex: string, label: string, tailwind: string }}
 */
export function calcularStatusVisita({
  dataPlanejada,
  preVisitaFeita,
  posVisitaFeita,
  agora = new Date(),
}) {
  // 1 · Pós-visita já registrada → sempre verde
  if (posVisitaFeita) return VISIT_COLORS.POS_FEITA;

  // 2 · Monta o deadline: 18:00 do dia planejado
  const deadline = new Date(dataPlanejada);
  deadline.setHours(18, 0, 0, 0);

  // 3 · Passou das 18h sem pós-visita → vermelho
  if (agora > deadline) return VISIT_COLORS.ATRASADO;

  // 4 · Pré-visita feita (e ainda dentro do prazo) → azul
  if (preVisitaFeita) return VISIT_COLORS.PRE_FEITA;

  // 5 · Ainda dentro do prazo, sem pré → neutro
  return VISIT_COLORS.PLANEJADO;
}

// ============================================================
// Exemplos de uso
// ============================================================

// Visita concluída
calcularStatusVisita({
  dataPlanejada: new Date('2025-07-10'),
  preVisitaFeita: true,
  posVisitaFeita: true,
});
// → { hex: '#22C55E', label: 'Concluído', ... }

// Pré feita, pós pendente, DENTRO do prazo (simula 10h)
calcularStatusVisita({
  dataPlanejada: new Date('2025-07-10'),
  preVisitaFeita: true,
  posVisitaFeita: false,
  agora: new Date('2025-07-10T10:00:00'),
});
// → { hex: '#3B82F6', label: 'Pré-visita', ... }

// Nada feito, DEPOIS das 18h
calcularStatusVisita({
  dataPlanejada: new Date('2025-07-10'),
  preVisitaFeita: false,
  posVisitaFeita: false,
  agora: new Date('2025-07-10T20:00:00'),
});
// → { hex: '#EF4444', label: 'Atrasado', ... }

// ============================================================
// Hook React (Next.js / React)
// ============================================================
// lib/useVisitStatus.js
import { useMemo } from 'react';
import { calcularStatusVisita } from './visitStatus';

export function useVisitStatus(visita) {
  return useMemo(
    () => calcularStatusVisita({
      dataPlanejada:  new Date(visita.data_planejada),
      preVisitaFeita: visita.pre_visita_feita,
      posVisitaFeita: visita.pos_visita_feita,
    }),
    [visita.data_planejada, visita.pre_visita_feita, visita.pos_visita_feita]
  );
}

// ============================================================
// Atualização em batch via Supabase (cron job / server action)
// Marca visitas como ATRASADO direto no banco às 18:00
// ============================================================
// app/api/cron/update-status/route.js
export async function marcarAtrasados(supabase) {
  const hoje = new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('visitas')
    .update({ status: 'ATRASADO' })
    .eq('data_planejada', hoje)
    .eq('pos_visita_feita', false)
    .lt('hora_planejada', '18:00:00');

  if (error) throw error;
}`;

const offlineCode = `// ============================================================
// FluxoREP · Fila de Sincronização Offline (PWA)
// Arquitetura: IndexedDB (idb-keyval) + Background Sync API
// ============================================================

// lib/offlineQueue.js
import { get, set, del, keys, createStore } from 'idb-keyval';

const syncStore = createStore('fluxorep-sync', 'queue');

// ────────────────────────────────────────────────────────────
// ESTRUTURA DE ITEM NA FILA
// ────────────────────────────────────────────────────────────
/*
{
  syncId:    "uuid-v4-gerado-no-cliente",  ← chave de idempotência
  table:     "visitas" | "insights",
  operation: "upsert" | "delete",
  payload:   { ...dadosCompletos, sync_id: "..." },
  createdAt: "2025-07-10T16:30:00.000Z",
  attempts:  0,
  lastError: null
}
*/

// ────────────────────────────────────────────────────────────
// Adiciona item à fila (chamado offline)
// ────────────────────────────────────────────────────────────
export async function enqueue(table, operation, payload) {
  const syncId = crypto.randomUUID();
  const item = {
    syncId,
    table,
    operation,
    payload: { ...payload, sync_id: syncId },
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError: null,
  };

  await set(syncId, item, syncStore);

  // Solicita Background Sync ao Service Worker (quando disponível)
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready;
    await reg.sync.register('fluxorep-sync-queue');
  }

  return syncId;
}

// ────────────────────────────────────────────────────────────
// Processa a fila (chamado pelo SW ou ao retomar conexão)
// ────────────────────────────────────────────────────────────
export async function processQueue(supabase) {
  const allKeys = await keys(syncStore);

  for (const key of allKeys) {
    const item = await get(key, syncStore);
    if (!item) continue;

    try {
      if (item.operation === 'upsert') {
        const { error } = await supabase
          .from(item.table)
          .upsert(item.payload, { onConflict: 'sync_id' });

        if (error) throw error;
      }

      if (item.operation === 'delete') {
        const { error } = await supabase
          .from(item.table)
          .delete()
          .eq('id', item.payload.id);

        if (error) throw error;
      }

      // Sucesso: remove da fila
      await del(key, syncStore);

    } catch (err) {
      // Falhou: incrementa tentativas, guarda erro
      await set(key, {
        ...item,
        attempts: item.attempts + 1,
        lastError: err.message,
      }, syncStore);

      // Abandona após 5 tentativas (requer ação manual)
      if (item.attempts >= 5) {
        console.error('[FluxoREP] Item abandonado após 5 tentativas:', item);
      }
    }
  }
}

// ────────────────────────────────────────────────────────────
// Retorna contagem de itens pendentes (para badge de UI)
// ────────────────────────────────────────────────────────────
export async function getPendingCount() {
  return (await keys(syncStore)).length;
}

// ============================================================
// public/sw.js  ·  Service Worker
// ============================================================
/*
self.addEventListener('sync', (event) => {
  if (event.tag === 'fluxorep-sync-queue') {
    event.waitUntil(
      // Importa supabase no SW (bundle separado) e processa
      import('/sw-sync.js').then(({ processQueueSW }) => processQueueSW())
    );
  }
});
*/

// ============================================================
// Uso no componente de pós-visita
// ============================================================
// app/visita/[id]/pos-visita/page.jsx

import { enqueue } from '@/lib/offlineQueue';
import { calcularStatusVisita } from '@/lib/visitStatus';

async function salvarPosVisita(visitaId, dados) {
  const payload = {
    id:               visitaId,
    pos_visita_feita: true,
    pos_visita_at:    new Date().toISOString(),
    resultado:        dados.resultado,
    proxima_acao:     dados.proximaAcao,
    produtos_abordados: dados.produtos,
    status:           'POS_FEITA',
    updated_at:       new Date().toISOString(),
  };

  if (!navigator.onLine) {
    // Salva localmente e enfileira
    const syncId = await enqueue('visitas', 'upsert', payload);
    return { offline: true, syncId };
  }

  // Online: salva direto no Supabase
  const { data, error } = await supabase
    .from('visitas')
    .update(payload)
    .eq('id', visitaId)
    .select()
    .single();

  if (error) throw error;
  return { offline: false, data };
}`;

const deepLinkCode = `// ============================================================
// FluxoREP · Deep Links para GPS via Google Place ID
// ============================================================

/**
 * Monta URLs de navegação para o endereço do médico.
 *
 * Estratégia:
 *  1. Tenta Google Maps com Place ID (mais preciso).
 *  2. Fallback para query de texto se não houver Place ID.
 *  3. Fallback final: Apple Maps (iOS nativo).
 *
 * @param {Object} medico
 * @returns {{ googleMaps: string, appleMaps: string, universalLink: string }}
 */
export function buildGpsLinks(medico) {
  const {
    google_place_id,
    clinica,
    local_complexo,
    sala_andar,
    nome,
  } = medico;

  // ── Google Maps com Place ID (abre o pin exato do complexo) ──
  // Formato: https://www.google.com/maps/place/?q=place_id:XXXX
  const googleMapsPlaceId = google_place_id
    ? \`https://www.google.com/maps/place/?q=place_id:\${google_place_id}\`
    : null;

  // ── Google Maps com query de texto (fallback) ──
  const textQuery = [clinica, local_complexo, sala_andar]
    .filter(Boolean)
    .join(', ');
  const googleMapsText = \`https://www.google.com/maps/search/?api=1&query=\${
    encodeURIComponent(textQuery)
  }\`;

  // ── URL Universal (resolve automaticamente no device) ──
  // Em iOS com Google Maps instalado abre lá; senão Apple Maps
  const universalLink = google_place_id
    ? \`comgooglemaps://?q=\${encodeURIComponent(clinica || nome)}&place_id=\${google_place_id}\`
    : \`maps://maps.apple.com/?q=\${encodeURIComponent(textQuery)}\`;

  // ── Apple Maps (iOS nativo, sem app externo) ──
  const appleMaps = \`https://maps.apple.com/?q=\${encodeURIComponent(textQuery)}\`;

  return {
    googleMaps:   googleMapsPlaceId ?? googleMapsText,
    googleMapsText,
    appleMaps,
    universalLink,
  };
}

// ============================================================
// Componente React — Botão "Abrir no GPS"
// ============================================================
// components/GpsButton.jsx

import { buildGpsLinks } from '@/lib/gpsLinks';

export function GpsButton({ medico }) {
  const links = buildGpsLinks(medico);

  function handleOpen() {
    // Detecta iOS para usar universal link (Apple Maps / Google Maps nativo)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const url = isIOS ? links.universalLink : links.googleMaps;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <button onClick={handleOpen} aria-label="Abrir endereço no GPS">
      <i className="ti ti-map-pin" aria-hidden="true" />
      Abrir no GPS
    </button>
  );
}

// ============================================================
// Exemplos de URL geradas
// ============================================================

// Médico com google_place_id
// medico = {
//   google_place_id: "ChIJN1t_tDeuEmsRUsoyG83frY4",
//   clinica: "Clínica São Lucas",
//   local_complexo: "RioMar Fortaleza",
//   sala_andar: "Sala 302 · 3º Andar"
// }

// → googleMaps:
//   https://www.google.com/maps/place/?q=place_id:ChIJN1t_tDeuEmsRUsoyG83frY4

// → appleMaps:
//   https://maps.apple.com/?q=Cl%C3%ADnica%20S%C3%A3o%20Lucas%2C%20RioMar%20Fortaleza%2C%20Sala%20302

// Médico sem google_place_id
// → googleMaps:
//   https://www.google.com/maps/search/?api=1&query=Cl%C3%ADnica%20S%C3%A3o%20Lucas%2C%20Aldeota`;

const CONTENT = { sql: sqlCode, status: statusCode, offline: offlineCode, deeplink: deepLinkCode };
const TITLES = {
  sql: "Schema SQL · Supabase",
  status: "Lógica de Status · JavaScript",
  offline: "Sincronização Offline · PWA",
  deeplink: "Deep Link GPS · Google Place ID",
};

export default function FluxoRepDocs() {
  const [active, setActive] = useState("sql");
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(CONTENT[active]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ fontFamily: "var(--font-mono, monospace)", padding: "0 0 2rem" }}>
      {/* Header */}
      <div style={{ borderBottom: "0.5px solid var(--color-border-tertiary)", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{
            background: "var(--color-background-info)",
            color: "var(--color-text-info)",
            fontSize: 11,
            fontWeight: 500,
            padding: "3px 10px",
            borderRadius: "var(--border-radius-md)",
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.04em",
            textTransform: "uppercase"
          }}>Arquitetura</span>
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontFamily: "var(--font-sans)" }}>Next.js · Supabase · PWA</span>
        </div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}>
          FluxoREP — Entregáveis Técnicos
        </h2>
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex",
        gap: 4,
        marginBottom: "1.25rem",
        flexWrap: "wrap",
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: "var(--border-radius-md)",
              border: active === tab.id
                ? "0.5px solid var(--color-border-info)"
                : "0.5px solid var(--color-border-tertiary)",
              background: active === tab.id
                ? "var(--color-background-info)"
                : "var(--color-background-secondary)",
              color: active === tab.id
                ? "var(--color-text-info)"
                : "var(--color-text-secondary)",
              fontSize: 13,
              fontWeight: active === tab.id ? 500 : 400,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            <i className={`ti ${tab.icon}`} style={{ fontSize: 14 }} aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code block */}
      <div style={{
        background: "var(--color-background-secondary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        overflow: "hidden",
      }}>
        {/* Code header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
        }}>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>
            {TITLES[active]}
          </span>
          <button
            onClick={copy}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: "var(--border-radius-md)",
              background: copied ? "var(--color-background-success)" : "var(--color-background-primary)",
              color: copied ? "var(--color-text-success)" : "var(--color-text-secondary)",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s",
            }}
          >
            <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} style={{ fontSize: 13 }} aria-hidden="true" />
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
        {/* Scrollable code */}
        <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 520 }}>
          <pre style={{
            margin: 0,
            padding: "1rem 1.25rem",
            fontSize: 12.5,
            lineHeight: 1.7,
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-mono, 'Fira Code', monospace)",
            whiteSpace: "pre",
            tabSize: 2,
          }}>
            <code>{CONTENT[active]}</code>
          </pre>
        </div>
      </div>

      {/* Status legend (only on tab 2) */}
      {active === "status" && (
        <div style={{
          marginTop: "1rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 8,
        }}>
          {[
            { color: "#94A3B8", label: "Planejado", desc: "Neutro · sem ação" },
            { color: "#3B82F6", label: "Pré-visita", desc: "Azul · pré feita" },
            { color: "#22C55E", label: "Concluído", desc: "Verde · pós feita" },
            { color: "#EF4444", label: "Atrasado", desc: "Vermelho · após 18h" },
          ].map(s => (
            <div key={s.label} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              background: "var(--color-background-secondary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-md)",
            }}>
              <div style={{
                width: 12, height: 12, borderRadius: "50%",
                background: s.color, flexShrink: 0,
              }} />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)", color: "var(--color-text-primary)" }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-tertiary)", fontFamily: "var(--font-sans)" }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offline legend */}
      {active === "offline" && (
        <div style={{
          marginTop: "1rem",
          padding: "12px 16px",
          background: "var(--color-background-warning)",
          border: "0.5px solid var(--color-border-warning)",
          borderRadius: "var(--border-radius-md)",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 16, color: "var(--color-text-warning)", marginTop: 1, flexShrink: 0 }} aria-hidden="true" />
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-warning)", fontFamily: "var(--font-sans)", lineHeight: 1.6 }}>
            Instale <code style={{ background: "rgba(0,0,0,0.08)", padding: "1px 5px", borderRadius: 4 }}>idb-keyval</code> via <code style={{ background: "rgba(0,0,0,0.08)", padding: "1px 5px", borderRadius: 4 }}>npm i idb-keyval</code>.
            A Background Sync API requer HTTPS e Service Worker registrado. Adicione <code style={{ background: "rgba(0,0,0,0.08)", padding: "1px 5px", borderRadius: 4 }}>next-pwa</code> ao projeto para gerar o SW automaticamente.
          </p>
        </div>
      )}

      {/* Deep link legend */}
      {active === "deeplink" && (
        <div style={{
          marginTop: "1rem",
          padding: "12px 16px",
          background: "var(--color-background-info)",
          border: "0.5px solid var(--color-border-info)",
          borderRadius: "var(--border-radius-md)",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}>
          <i className="ti ti-info-circle" style={{ fontSize: 16, color: "var(--color-text-info)", marginTop: 1, flexShrink: 0 }} aria-hidden="true" />
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-info)", fontFamily: "var(--font-sans)", lineHeight: 1.6 }}>
            O <strong>Place ID</strong> é obtido via <strong>Google Places Autocomplete</strong> no cadastro do médico.
            Armazene-o em <code style={{ background: "rgba(0,0,0,0.1)", padding: "1px 5px", borderRadius: 4 }}>medicos.google_place_id</code> e
            em <code style={{ background: "rgba(0,0,0,0.1)", padding: "1px 5px", borderRadius: 4 }}>clinicas.google_place_id</code> para complexos compartilhados.
          </p>
        </div>
      )}
    </div>
  );
}
