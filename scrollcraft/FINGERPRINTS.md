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

- Superfície viva (calu-lp): barra de status + trilho de etapas, fechamento com input real dentro de palco pinado, livro-razão que vira relatório.
- Marketing em cenas (calu-lp-marketing): hero em planos com parallax, um único pin como pico (o mês se montando), fechamento em cartão de CTA com rodapé aberto.
- Editorial noir (calu-lp-editorial): capítulos numerados com linhas finas, hero tipográfico com contorno sobre órbita SVG, elenco tipográfico expansível, fecho em bloco limão de página inteira.

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
| calu-lp-marketing (2026-09-07, substitui a superfície viva em produção) | Marketing premium, cenas distintas: hero dimensional + argumento por seções | Barra de marketing translúcida (logo, âncoras, Diagnóstico IA, CTA), menu overlay no celular | Hero em planos (`flow` + `parallax`): fundo de luz a -1.3, grade a -0.6, texto e card do time a 1x, névoa limão a 0.9 na frente, sem cobrir o CTA | flow (hero), seções livres com `in`/`reveal`, 1 pin 3.0 (pico: o mês se montando), seções livres até o CTA; ~14.7vh celular | CTA em cartão limão (Diagnóstico + WhatsApp) e rodapé aberto, sem palco pinado | O mês se montando: calendário editorial e fila de aprovação populam via `--sc-p` e o contador de peças acompanha, rotulado como demonstração | Não fotográfico: luz, grade e a interface do produto como ilustração | React (rota /), motor em /public/scrollcraft, Cloudflare Workers |
| calu-lp-editorial (2026-09-07, substitui a versão de marketing em produção) | Editorial noir: revista de luxo em preto, capítulos numerados separados por linhas finas, sem cards | Barra mínima (marca, quatro âncoras, Entrar, um botão limão), menu de tela cheia tipográfico no celular | Hero tipográfico em três linhas (a terceira só contorno) sobre a órbita dos doze (anel SVG girando, nó ativo em limão) com dois planos em parallax | flow (hero), manifesto com reveal, 01 processo em linhas expansíveis, 1 pin 3.0 (pico: o mês se montando em grade de linhas), 02 serviços em índice, 03 soluções em fichas, 04 elenco tipográfico, 05 custo em tabela de linhas; ~13.1vh desktop | Bloco limão de página inteira com título gigante, dois botões e uma nota; rodapé mínimo | Órbita dos doze + elenco tipográfico: o time é a ilustração, e os nomes abrem como fichas | Não fotográfico: tipografia, linhas finas, luz e um anel | React (rota /), motor em /public/scrollcraft, Cloudflare Workers |
| calu-lp-editorial v2 (2026-09-08, direção de arte e copy revisados) | Editorial noir, mesma gramática da linha anterior | Barra mínima com CTA em contorno | Hero NUORBIT: CRIATIVIDADE espaçada atravessando um anel de luz (metade atrás, metade na frente), aurora em canvas atrás, doze nós no anel | flow (hero), manifesto por palavras, 01 processo, pin 2.6 (o mês, com linha de progresso e estado publicado ao harness), 02 a 06 (serviços, soluções, time, custo, perguntas); 12.0vh desktop | Bloco limão de página inteira | Palavra atravessando o anel de luz + o mês se montando | Não fotográfico: tipografia, linhas, luz | React (rota /), motor em /public/scrollcraft, Cloudflare Workers |
