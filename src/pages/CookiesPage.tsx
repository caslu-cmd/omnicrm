import { Link } from "react-router-dom";
import caluLogo from "@/assets/calu-logo.png";
import { revogarConsentimento, lerConsentimento } from "@/lib/consent";
import { useState } from "react";
import { toast } from "sonner";

export default function CookiesPage() {
  const [consentimento, setConsentimento] = useState(lerConsentimento());

  const revisar = () => {
    revogarConsentimento();
    setConsentimento(null);
    toast.success("Preferências apagadas. O aviso vai aparecer novamente.");
  };

  return (
    <div className="min-h-screen bg-[#07080A] text-white">
      <header className="border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <Link to="/" className="flex items-center gap-2 text-[#B9FF4B] font-bold text-lg sm:text-xl tracking-tight">
          <img src={caluLogo} alt="Calu Agência" className="h-8 w-8 rounded-md object-cover" />
          Calu Agência
        </Link>
        <Link to="/" className="text-sm text-white/50 hover:text-white transition-colors">← Voltar</Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Política de Cookies</h1>
        <p className="text-white/40 text-sm mb-10 sm:mb-12">Última atualização: 28 de julho de 2026</p>

        <Section title="1. O que são cookies">
          <p>
            Cookies e tecnologias equivalentes (como <em>localStorage</em>) são pequenos arquivos
            guardados no seu navegador. Nesta plataforma, eles servem para manter você conectada e
            para lembrar ajustes das telas — nunca para montar perfil publicitário.
          </p>
        </Section>

        <Section title="2. O que usamos, na prática">
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-left" style={{ color: "rgba(255,255,255,0.45)" }}>
                  <th className="pb-2 pr-4 font-medium">Categoria</th>
                  <th className="pb-2 pr-4 font-medium">Para que serve</th>
                  <th className="pb-2 font-medium">Precisa de consentimento?</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                <Linha
                  cat="Essenciais"
                  uso="Sessão de login (Supabase Auth) e segurança da conta"
                  consent="Não — sem eles não há acesso"
                />
                <Linha
                  cat="Preferências"
                  uso="Identidade visual do cliente, painéis abertos, rascunhos de conteúdo"
                  consent="Sim"
                />
                <Linha
                  cat="Análise de uso"
                  uso="Métricas agregadas de navegação"
                  consent="Sim — e hoje não há nenhuma ferramenta ativa"
                />
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-white/60">
            <strong className="text-[#B9FF4B]">Não utilizamos</strong> pixels de publicidade, cookies
            de rastreamento entre sites ou venda de dados a terceiros.
          </p>
        </Section>

        <Section title="3. Serviços de terceiros">
          <p>
            Para funcionar, a plataforma se comunica com fornecedores que podem registrar dados
            técnicos de conexão (como endereço IP):
          </p>
          <ul className="list-disc list-inside space-y-2 text-white/80 mt-3">
            <li><strong>Supabase</strong> — banco de dados, autenticação e funções do servidor.</li>
            <li><strong>Cloudflare</strong> — entrega do site e proteção contra ataques.</li>
            <li><strong>Google Fonts</strong> — carregamento das fontes usadas no layout.</li>
            <li><strong>Meta (Facebook e Instagram)</strong> — apenas quando você conecta uma conta para publicar ou responder mensagens.</li>
            <li><strong>Anthropic (Claude)</strong> — processamento dos textos enviados aos agentes de IA.</li>
          </ul>
        </Section>

        <Section title="4. Como gerenciar">
          <p>
            Você pode rever sua escolha a qualquer momento pelo botão abaixo, ou apagar os dados
            diretamente nas configurações do seu navegador. Bloquear os cookies essenciais impede o
            login e o uso da plataforma.
          </p>
          <div className="mt-4 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs mb-3 text-white/50">
              {consentimento
                ? `Sua escolha atual: preferências ${consentimento.preferencias ? "aceitas" : "recusadas"}, análise ${consentimento.analise ? "aceita" : "recusada"} (registrada em ${new Date(consentimento.decididoEm).toLocaleDateString("pt-BR")}).`
                : "Você ainda não registrou uma escolha neste navegador."}
            </p>
            <button
              onClick={revisar}
              className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{ background: "#B9FF4B", color: "#07080A" }}
            >
              Rever minhas preferências
            </button>
          </div>
        </Section>

        <Section title="5. Seus direitos e contato">
          <p>
            A LGPD garante a você confirmação do tratamento, acesso, correção, portabilidade,
            eliminação e revogação do consentimento. Para exercer qualquer um deles, fale com a
            pessoa encarregada pelos dados:{" "}
            <a href="mailto:contato@caluagencia.com.br" className="text-[#B9FF4B] underline">
              contato@caluagencia.com.br
            </a>.
          </p>
          <p className="mt-3">
            Detalhes sobre finalidades, bases legais e prazos estão na{" "}
            <Link to="/privacy" className="text-[#B9FF4B] underline">Política de Privacidade</Link>.
          </p>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg sm:text-xl font-bold mb-3 text-[#B9FF4B]">{title}</h2>
      <div className="space-y-3 text-white/70 leading-relaxed text-sm sm:text-base">{children}</div>
    </section>
  );
}

function Linha({ cat, uso, consent }: { cat: string; uso: string; consent: string }) {
  return (
    <tr className="border-t border-white/10">
      <td className="py-3 pr-4 font-medium text-white/90">{cat}</td>
      <td className="py-3 pr-4">{uso}</td>
      <td className="py-3">{consent}</td>
    </tr>
  );
}
