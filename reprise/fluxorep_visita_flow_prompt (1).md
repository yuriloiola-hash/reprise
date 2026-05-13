# PROMPT — FluxoREP: Correção do Fluxo de Visitas + Pré e Pós-Visita
# Cole este prompt no Antigravity

---

## 1. CORREÇÃO CRÍTICA — rep_id nulo ao registrar visita

**Erro:** `null value in column "rep_id" of relation "visitas" violates not-null constraint`

**Causa:** o campo `rep_id` não está sendo preenchido antes do INSERT.

**Correção obrigatória em TODOS os pontos que fazem INSERT ou UPSERT na tabela `visitas`:**

```typescript
// ANTES de qualquer insert em visitas, recupere o usuário autenticado:
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Usuário não autenticado');

// Inclua rep_id no payload:
const { error } = await supabase.from('visitas').insert({
  medico_id: medicoId,
  rep_id: user.id,           // ← OBRIGATÓRIO — era isso que faltava
  data_visita: dataVisita,
  status: 'planejado',
  pre_visita_feita: false,
  pos_visita_feita: false,
});
```

**Valide também:**
- Se `supabase.auth.getUser()` retornar `user = null`, exibir toast de erro claro: _"Sessão expirada. Faça login novamente."_ e redirecionar para `/login`.
- Nunca confiar em `supabase.auth.getSession()` para obter o user em server-side — use sempre `getUser()`.
- Adicionar o campo `rep_id UUID NOT NULL REFERENCES auth.users(id)` na tabela `visitas` caso ainda não exista (verificar migration).

---

## 2. FLUXO COMPLETO DE VISITA — Implementar do zero

### Visão geral do fluxo

```
[Calendário / Lista]
      ↓ clica em horário vazio ou botão "+ Visita"
[Modal: Agendar Visita]  →  busca médico, define data/hora  →  SALVA
      ↓ clica no card da visita agendada
[Drawer: Visita Agendada]
      ↓ botão "Iniciar Pré-Visita"
[Tela: Pré-Visita]  →  mostra histórico de insights do médico  →  rep confirma que leu  →  SALVA pre_visita_feita = true
      ↓ botão "Registrar Pós-Visita"
[Tela: Pós-Visita]  →  formulário completo  →  SALVA pos_visita_feita = true + dados
      ↓ dados do insight vão para o perfil permanente do médico
[Perfil do Médico] → exibe todos os insights datados, notas de propaganda, percepção comportamental
```

---

## 3. MODAL — Agendar Nova Visita

**Trigger:** clique em slot vazio do calendário OU botão "+ Nova Visita" (FAB no mobile).

**Campos:**
- Busca de médico: input com autocomplete buscando em `medicos` por nome/especialidade/complexo
- Data e hora da visita (date + time picker)
- Observação inicial (opcional, TEXT)

**Ao salvar:**
```typescript
const { data: { user } } = await supabase.auth.getUser();

await supabase.from('visitas').insert({
  rep_id:          user.id,
  medico_id:       medicoSelecionado.id,
  data_visita:     `${data}T${hora}:00`,
  status:          'planejado',
  pre_visita_feita: false,
  pos_visita_feita: false,
});
```

**Feedback:** toast verde "Visita agendada com sucesso" + fechar modal + atualizar calendário.

---

## 4. DRAWER — Card de Visita (ao clicar em visita existente)

Abre um Drawer lateral (desktop) ou Bottom Sheet (mobile) com:

```
┌─────────────────────────────────────────┐
│  Dr. [Nome]  ·  [Especialidade]         │
│  [Badge CAT]  [Badge Status]            │
│  📍 [Clínica] · [Complexo] · [Sala]    │
│  🕐 [Data e hora formatada]             │
│─────────────────────────────────────────│
│  [Botão primário]:                      │
│  → Se pre_visita_feita = false:         │
│     "📋 Iniciar Pré-Visita"  (azul)    │
│  → Se pre_feita e !pos_feita:           │
│     "✅ Registrar Pós-Visita" (verde)  │
│  → Se pos_visita_feita = true:          │
│     "🔍 Ver Resumo da Visita" (cinza)  │
│─────────────────────────────────────────│
│  [Botão secundário]: "Ver Perfil Médico"│
│  [Botão terciário]:  "Reagendar"        │
└─────────────────────────────────────────┘
```

---

## 5. TELA — Pré-Visita

**Rota sugerida:** `/visitas/[id]/pre-visita`

**Ao abrir, buscar automaticamente:**
```typescript
// Todos os insights do médico desta visita, ordenados por data (mais recente primeiro)
const { data: insights } = await supabase
  .from('insights')
  .select('*')
  .eq('medico_id', visita.medico_id)
  .order('created_at', { ascending: false });

// Última visita concluída com este médico
const { data: ultimaVisita } = await supabase
  .from('visitas')
  .select('*, insights(*)')
  .eq('medico_id', visita.medico_id)
  .eq('pos_visita_feita', true)
  .order('data_visita', { ascending: false })
  .limit(1)
  .single();
```

**Layout da tela:**

```
┌─────────────────────────────────────────────┐
│  ← Voltar    PRÉ-VISITA                     │
│  Dr. [Nome]  ·  [Data de hoje]              │
├─────────────────────────────────────────────┤
│  📌 ÚLTIMA VISITA  [data da última visita]  │
│  Nota propaganda: ★ 7/10                    │
│  Observações: "[texto da última visita]"    │
├─────────────────────────────────────────────┤
│  💡 HISTÓRICO DE INSIGHTS  ([N] registros)  │
│                                             │
│  [Card insight 1 — mais recente]            │
│  [Data · tipo de insight]                   │
│  "[texto do insight]"                       │
│                                             │
│  [Card insight 2]                           │
│  ...                                        │
│                                             │
│  (Se não houver insights:)                  │
│  "Nenhum insight anterior. Primeira visita?"│
├─────────────────────────────────────────────┤
│  [Botão grande azul]                        │
│  "Confirmar Leitura e Iniciar Visita"       │
│  → Salva pre_visita_feita = true            │
│  → status = 'planejado' (mantém até pós)   │
└─────────────────────────────────────────────┘
```

**Ao confirmar:**
```typescript
await supabase.from('visitas')
  .update({ pre_visita_feita: true })
  .eq('id', visitaId);
// Redireciona de volta para o calendário ou drawer
```

---

## 6. TELA — Pós-Visita

**Rota sugerida:** `/visitas/[id]/pos-visita`

**Layout em seções colapsáveis (accordion):**

### Seção 1 — Novo Insight (obrigatório)
```
Textarea: "O que aconteceu nesta visita?"
  placeholder: "Ex: Médico demonstrou interesse em Cardio Plus para pacientes com HAS..."
  minHeight: 120px
  maxLength: 1000

Toggle: 🔒 Insight privado (só você vê)
  default: false
```

### Seção 2 — Avaliação da Propaganda
```
Label: "Como foi a apresentação?"
Componente: 11 botões circulares numerados de 0 a 10
  0–4: vermelho  #DC2626
  5–6: âmbar     #D97706
  7–8: azul      #2563EB
  9–10: verde    #16A34A
Botão selecionado: fundo sólido na cor, texto branco, scale 1.1
Não selecionado: borda 1.5px, texto colorido, fundo transparente
```

### Seção 3 — Percepção Comportamental
```
4 sliders independentes, escala 0–10, cada um com label e ícone:

⚡ Risco         [slider 0────●────10]  valor atual: 5
🕐 Paciência     [slider 0────●────10]  valor atual: 5
💬 Extroversão   [slider 0────●────10]  valor atual: 5
📋 Normas        [slider 0────●────10]  valor atual: 5

Cor do thumb do slider: #0047CC
Track preenchida: #0047CC, track vazia: #D6E3F0
Exibir valor numérico à direita de cada slider
```

### Seção 4 — Observações Permanentes
```
Label: "Observações sobre o médico"
Sublabel: "Ficará visível no perfil do médico em todas as visitas futuras"
Textarea: observacoes (TEXT, campo permanente em medicos)
  Pré-preencher com o valor atual de medicos.observacoes (se houver)
  placeholder: "Ex: Prefere reuniões curtas. Chegar antes das 10h..."
```

**Ao salvar a pós-visita:**
```typescript
const { data: { user } } = await supabase.auth.getUser();

// 1. Atualizar visita
await supabase.from('visitas').update({
  pos_visita_feita:   true,
  status:             'concluido',
  nota_propaganda:    notaPropaganda,     // SMALLINT 0–10
  perfil_risco:       perfilRisco,        // NUMERIC 0–10
  perfil_paciencia:   perfilPaciencia,
  perfil_extroversao: perfilExtroversao,
  perfil_normas:      perfilNormas,
  updated_at:         new Date().toISOString(),
}).eq('id', visitaId);

// 2. Salvar insight no perfil do médico (permanente)
if (textoInsight.trim()) {
  await supabase.from('insights').insert({
    medico_id:  visita.medico_id,
    visita_id:  visitaId,
    rep_id:     user.id,
    texto:      textoInsight,
    eh_privado: ehPrivado,
  });
}

// 3. Atualizar observações permanentes no perfil do médico
if (observacoes !== observacoesOriginais) {
  await supabase.from('medicos').update({
    observacoes: observacoes,
    updated_at:  new Date().toISOString(),
  }).eq('id', visita.medico_id);
}
```

**Feedback:** toast verde "Visita concluída!" → redireciona para o calendário com o card atualizado em verde.

---

## 7. ABA MÉDICOS — Perfil do Médico (atualizar)

Ao abrir o perfil de um médico, exibir uma seção **"Histórico de Visitas e Insights"**:

```typescript
// Buscar visitas com insights
const { data } = await supabase
  .from('visitas')
  .select(`
    id, data_visita, status, nota_propaganda,
    perfil_risco, perfil_paciencia, perfil_extroversao, perfil_normas,
    insights ( id, texto, eh_privado, created_at )
  `)
  .eq('medico_id', medicoId)
  .order('data_visita', { ascending: false });
```

**Layout do perfil:**

```
┌─────────────────────────────────────────────┐
│  Dr. [Nome] · [Especialidade]               │
│  [CAT badge] · [Marcas-chave]               │
│  📍 [Clínica] · [Complexo] · [Sala]        │
├─────────────────────────────────────────────┤
│  📝 OBSERVAÇÕES PERMANENTES                 │
│  "[texto de medicos.observacoes]"           │
├─────────────────────────────────────────────┤
│  🕐 HISTÓRICO DE VISITAS                   │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ [Status pill] · [Data formatada]     │  │
│  │ ★ Propaganda: 8/10                   │  │
│  │ Perfil: Risco 6 · Paciência 4 · ...  │  │
│  │                                       │  │
│  │ 💡 Insights desta visita:            │  │
│  │   • "[texto insight 1]"              │  │
│  │   • "[texto insight 2]"              │  │
│  └──────────────────────────────────────┘  │
│  [visita mais antiga...]                    │
└─────────────────────────────────────────────┘
```

**Regra de privacidade dos insights:**
```typescript
// Exibir apenas insights públicos OU criados pelo rep logado
.or(`eh_privado.eq.false,rep_id.eq.${user.id}`)
```

---

## 8. MIGRATION SQL — Adicionar coluna observacoes em medicos

Se a coluna `observacoes` não existir na tabela `medicos`, rodar no Supabase SQL Editor:

```sql
-- Adiciona observações permanentes ao perfil do médico
ALTER TABLE medicos
  ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Adiciona rep_id em insights (caso não exista)
ALTER TABLE insights
  ADD COLUMN IF NOT EXISTS rep_id UUID REFERENCES auth.users(id);

-- Índice para filtro de privacidade de insights
CREATE INDEX IF NOT EXISTS idx_insights_rep_privado
  ON insights (rep_id, eh_privado);
```

---

## 9. ESTADOS DE LOADING E ERRO

Para cada operação assíncrona, implementar:

```
Loading:  skeleton animado nos cards de insight
          spinner no botão de salvar (desabilitar clique duplo)

Erro:     toast vermelho com mensagem clara
          "Erro ao salvar visita. Verifique sua conexão."

Sucesso:  toast verde 3 segundos, some automaticamente

Offline:  se !navigator.onLine → enfileirar no IndexedDB e exibir
          banner amarelo "Você está offline. Dados salvos localmente."
```

---

## 10. O QUE NÃO MUDAR

- Design system e paleta de cores definidos anteriormente
- Estrutura de tabelas SQL (apenas adicionar colunas com ALTER TABLE)
- Lógica de cálculo de status de visita (calcularStatusVisita)
- Estrutura de rotas existente
- Componentes de sidebar, topbar, calendário já estilizados

---

## RESUMO DAS PRIORIDADES (ordem de implementação)

1. 🔴 CRÍTICO: Corrigir rep_id nulo em todas as inserções de visitas
2. 🟠 IMPORTANTE: Fluxo Pré-Visita com histórico de insights
3. 🟠 IMPORTANTE: Fluxo Pós-Visita com nota, perfil comportamental e insight
4. 🟡 RELEVANTE: Perfil do médico com histórico consolidado
5. 🟡 RELEVANTE: Migration SQL para coluna observacoes
