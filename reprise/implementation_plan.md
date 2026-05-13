# 🚀 Plano de Evolução: REPrise (FluxoREP)

Este documento detalha as etapas para transformar o layout atual em uma interface de alta performance, corrigindo inconsistências visuais e adicionando a visão semanal solicitada.

---

## 🎨 Etapa 1: Refatoração do Design System e Cores
**Objetivo:** Alinhar as cores com a arquitetura Sirius e elevar a estética para o nível "Premium".

- **Correção Cromática (Tab 2):**
  - Reajustar `lib/visitStatus.ts` para usar hexadecimais puros:
    - `PLANEJADO`: #94A3B8 (Neutro)
    - `PRE_FEITA`: #3B82F6 (Azul Vibrante)
    - `POS_FEITA`: #22C55E (Verde Esmeralda)
    - `ATRASADO`: #EF4444 (Vermelho Alerta)
- **Geometria e Espaçamento:**
  - Aumentar o `padding` interno dos cards para `p-8`.
  - Usar `rounded-[2rem]` para um aspecto mais orgânico e moderno.
  - Implementar uma escala tipográfica mais agressiva (títulos maiores, pesos 900 para destaque).
- **TimeGrid Visual Fix:** Substituir fundos opacos por bordas laterais coloridas de 6px, mantendo o fundo do card branco limpo.

---

## 📅 Etapa 2: Dashboard Semanal (Week-Grid)
**Objetivo:** Permitir que o propagandista visualize sua rota completa de Segunda a Sexta.

- **Nova Estrutura da Home:**
  - Adicionar um "Switch" de visualização: **Hoje** vs **Semana**.
  - **Grade de 5 Colunas:** Layout horizontal (desktop) e scroll horizontal (mobile) para os dias da semana.
- **Lógica de Dados:**
  - Hoje: Quarta-feira, 13 de Maio.
  - O sistema deve calcular automaticamente o intervalo da semana corrente (11 a 15 de Maio).
- **Mini-Indicadores:** Mostrar o número de visitas pendentes/concluídas por dia na visão semanal.

---

## 🛠️ Etapa 3: Polimento de Layout e UX Mobile
**Objetivo:** Refinar a usabilidade em campo.

- **Sidebar Glassmorphism:** Aplicar `backdrop-blur-md` e transparência na barra lateral.
- **Botões de Ação:** Aumentar a altura mínima dos botões interativos para 48px (padrão de acessibilidade mobile).
- **Skeleton Screens:** Adicionar estados de carregamento elegantes para evitar saltos de layout ao buscar dados do Supabase.

---

**Como proceder?**
Para executar uma etapa, basta me pedir aqui no chat. Exemplo: "Execute a Etapa 1".
