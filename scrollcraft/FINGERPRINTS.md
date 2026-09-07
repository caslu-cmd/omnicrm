# Fingerprints

Every site you build with **scroll-craft** gets one row here, appended after it
ships. The registry exists so your next build can prove it is a different page
rather than a re-skin of one you already made.

This file is **yours**. It starts empty on purpose: the gate is about not
repeating *yourself*, so it has nothing to say until you have built something.

The rules and the gate live in the skill's
`references/uniqueness.md`. Short version:

**A new build must differ from EVERY row below on at least 4 of the 6
dimensions.** Four against each row individually, not four on average across the
table. If a planned build fails, change the plan. Never edit a row to make room
for it.

The six dimensions are: **grammar**, **nav treatment**, **hero device**,
**act-sequence shape**, **close pattern**, **signature move**.

Dimension 6 is free, because a signature move is unique by definition. So the
gate really asks for three more out of the remaining five, and a build that
changes only grammar and world will fail it.

---

## The registry

| Build | Grammar | Nav treatment | Hero device | Act-sequence shape | Close pattern | Signature move | World | Port |
|---|---|---|---|---|---|---|---|---|

*(empty: your first build has nothing to clear, so build whatever the interview
points at. From the second onwards, this table is the constraint.)*

---

## What is taken

Add a bullet here whenever a build claims something a later build should avoid
reusing: a grammar, a nav treatment, a close pattern, a signature move, an
act-count-and-length band. The shared columns are what the next build inherits
as a constraint, so writing them down is the whole point.

Nothing is taken yet.

---

## Appending a row

After shipping, add one line to the table and one bullet to **What is taken** if
the build claimed something new. Fill every column. Say what the build shares
with existing rows.

Rows are append-only. A build that has been superseded stays in the table,
because the space it occupies is still occupied.

---

## Worked example

The skill's author kept a registry of twelve builds across eight page grammars.
If you want to see what a filled-in table looks like, and which shapes tend to
collide, read `EXAMPLES.md` in the scroll-craft repository. Treat it as
illustration only: those rows are somebody else's builds and they do **not**
constrain yours.
| calu-lp (2026-09-07) | Superfície viva (2.3) | Chrome do produto: barra de status fixa com cenário, etapa atual e livro-razão de entregas; trilho de etapas clicável à esquerda no desktop, tira de abas no rodapé no celular | Caixa de entrada já em estado (`flow` + `in`): briefing do cliente e resposta da Lia, painel de ajuda com o h1 ao lado | flow, pin 2.6, flow, pin 3.4 (pico), flow + reveal, pan 2.2, pin 1.2 = 7 atos, ~12.5vh desktop / 13.1vh celular | Palco pinado que segura: relatório calculado do estado da página + textarea real que envia o objetivo para /briefing; rodapé dentro do palco | Livro-razão que vira relatório: o contador da barra acumula entregas conforme o scroll, e o que o visitante aprova/devolve no trilho determina o relatório final | Não fotográfico: a própria interface do produto (painéis, calendário, fila), dados de demonstração rotulados | React (rota /), motor em /public/scrollcraft, Cloudflare Workers |
