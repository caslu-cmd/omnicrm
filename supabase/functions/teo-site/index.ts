import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_REPO = "caslu-cmd/abcer";
const GITHUB_API = "https://api.github.com";

const TEO_SYSTEM = `Você é TEO, Editor de Site da Calu Agência.

Você tem acesso direto ao repositório GitHub do cliente via a Calu Agência.
Stack do projeto: React + TypeScript + Tailwind CSS + Shadcn/ui (gerado no Lovable).

Quando receber uma solicitação de alteração:
1. Analise o arquivo original fornecido com atenção
2. Aplique SOMENTE as mudanças pedidas — não altere o que não foi solicitado
3. Retorne o arquivo COMPLETO e funcional com as mudanças
4. Explique de forma concisa (1-3 linhas) o que foi alterado e por quê

Formato OBRIGATÓRIO de resposta:
- Explicação curta das mudanças
- Código completo do arquivo em bloco \`\`\`tsx ... \`\`\`

Se a solicitação for de análise ou consulta (sem edição), responda diretamente sem bloco de código.
Sempre em português brasileiro.`;

// O repositório é digitado à mão no cadastro do cliente, então chega em
// formatos variados ("https://github.com/dono/repo", com .git, com barra).
// A API do GitHub só aceita "dono/repo" — sem isto a URL vira lixo e a
// função devolvia 500 sem dizer o motivo.
function normalizarRepo(valor: string): string {
  return valor
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/^\/+|\/+$/g, "");
}

function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

function fileToPageInfo(name: string, filePath: string) {
  const base = name.replace(/\.(tsx?|jsx?)$/, "");
  const clean = base.replace(/Page$|View$|Screen$/, "");
  const pageName = clean.replace(/([A-Z])/g, " $1").trim() || clean;
  const slug = clean.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  const url = slug === "index" || slug === "home" || slug === "" ? "/" : `/${slug}`;
  return { page_name: pageName.trim(), url, file_path: filePath };
}

async function listFiles(token: string, repo: string, path = "") {
  const url = `${GITHUB_API}/repos/${repo}/contents/${path}`;
  const r = await fetch(url, { headers: ghHeaders(token) });
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${await r.text()}`);
  const data = await r.json();
  const items = Array.isArray(data) ? data : [data];
  return items
    .filter((f: any) => !["node_modules", ".git", "dist"].includes(f.name))
    .map((f: any) => ({ name: f.name, path: f.path, type: f.type, size: f.size }));
}

async function listPages(token: string, repo: string) {
  // Antes qualquer falha do GitHub virava "nenhuma página": token expirado,
  // repositório privado sem permissão e pasta inexistente davam o mesmo
  // resultado vazio. Agora só a pasta ausente (404) é silenciosa.
  const candidates = ["src/pages", "pages", "src/app", "app"];
  let ultimoErro: string | null = null;

  for (const dir of candidates) {
    const url = `${GITHUB_API}/repos/${repo}/contents/${dir}`;
    const r = await fetch(url, { headers: ghHeaders(token) });
    if (!r.ok) {
      if (r.status !== 404) ultimoErro = `GitHub ${r.status}: ${(await r.text()).slice(0, 200)}`;
      continue;
    }
    const data = await r.json();
    if (!Array.isArray(data)) continue;
    const pageFiles = data.filter((f: any) =>
      f.type === "file" &&
      /\.(tsx?|jsx?)$/.test(f.name) &&
      !f.name.startsWith("_") &&
      !f.name.startsWith(".")
    );
    const pages = pageFiles.map((f: any) => fileToPageInfo(f.name, f.path));
    return { pages, dir };
  }

  if (ultimoErro) throw new Error(`Não consegui ler ${repo} — ${ultimoErro}`);
  return { pages: [], dir: null, aviso: `Nenhuma pasta de páginas encontrada em ${repo}` };
}

async function readFile(token: string, repo: string, path: string) {
  const url = `${GITHUB_API}/repos/${repo}/contents/${path}`;
  const r = await fetch(url, { headers: ghHeaders(token) });
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${await r.text()}`);
  const data = await r.json();
  const content = atob(data.content.replace(/\n/g, ""));
  return { content, sha: data.sha };
}

async function commitFile(token: string, repo: string, path: string, content: string, sha: string, message: string) {
  const url = `${GITHUB_API}/repos/${repo}/contents/${path}`;
  const encoded = btoa(unescape(encodeURIComponent(content)));
  const r = await fetch(url, {
    method: "PUT",
    headers: ghHeaders(token),
    body: JSON.stringify({ message, content: encoded, sha,
      committer: { name: "Teo (Calu Agência)", email: "teo@caluagencia.com.br" } }),
  });
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return { ok: true, commit: data.commit?.sha ?? "" };
}

async function teoChat(apiKey: string, message: string, filePath: string, fileContent: string, history: any[]) {
  const context = `**Arquivo atual:** \`${filePath}\`\n\n\`\`\`tsx\n${fileContent}\n\`\`\`\n\n**Solicitação:** ${message}`;
  const messages = [...history, { role: "user", content: context }];

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: TEO_SYSTEM,
      messages,
    }),
  });
  if (!r.ok) throw new Error(`Claude ${r.status}: ${await r.text()}`);
  const data = await r.json();
  const reply = data.content?.[0]?.text ?? "";

  const match = reply.match(/```(?:tsx?|jsx?|html?|css|js|ts)?\n([\s\S]*?)```/);
  const newContent = match ? match[1].trim() : null;

  return {
    reply,
    new_content: newContent,
    history: [...messages, { role: "assistant", content: reply }],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json();
    const { action } = body;
    const repo: string = normalizarRepo(body.repo || DEFAULT_REPO);

    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
      return new Response(JSON.stringify({
        error: `Repositório inválido: "${body.repo}". Use o formato dono/repositorio.`,
      }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const githubToken = Deno.env.get("GITHUB_TOKEN") ?? "";
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY") ?? "";

    if (!githubToken && ["list_files", "list_pages", "read_file", "commit"].includes(action)) {
      return new Response(JSON.stringify({ error: "GITHUB_TOKEN não configurado no Supabase" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    let result: any;

    if (action === "list_pages") {
      result = await listPages(githubToken, repo);

    } else if (action === "list_files") {
      result = { files: await listFiles(githubToken, repo, body.path ?? "") };

    } else if (action === "read_file") {
      result = await readFile(githubToken, repo, body.path);

    } else if (action === "chat") {
      if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada");
      result = await teoChat(apiKey, body.message, body.file_path, body.file_content, body.history ?? []);

    } else if (action === "commit") {
      result = await commitFile(githubToken, repo, body.path, body.content, body.sha, body.message ?? `Teo: atualiza ${body.path}`);

    } else {
      return new Response(JSON.stringify({ error: `action inválida: ${action}` }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
