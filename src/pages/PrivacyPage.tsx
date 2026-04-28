import { Link } from "react-router-dom";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#07080A] text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link to="/landing" className="text-[#B9FF4B] font-bold text-xl tracking-tight">
          Calu Agência
        </Link>
        <Link to="/landing" className="text-sm text-white/50 hover:text-white transition-colors">
          ← Voltar
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-white/40 text-sm mb-12">Última atualização: 28 de abril de 2026</p>

        <Section title="1. Quem somos">
          <p>
            A <strong className="text-[#B9FF4B]">Calu Agência</strong> opera a plataforma de gestão de
            agências de marketing disponível em <strong>omnicrm.lovable.app</strong>. Esta política
            descreve como coletamos, usamos e protegemos os dados dos nossos usuários, em conformidade
            com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018) e com as políticas da
            plataforma Meta (Facebook e Instagram).
          </p>
          <p className="mt-3">
            Em caso de dúvidas, entre em contato pelo e-mail:{" "}
            <a href="mailto:carolinielucas.cl@gmail.com" className="text-[#B9FF4B] underline">
              carolinielucas.cl@gmail.com
            </a>
          </p>
        </Section>

        <Section title="2. Dados que coletamos">
          <ul className="list-disc list-inside space-y-2 text-white/80">
            <li><strong>Dados de cadastro:</strong> nome, e-mail e senha (autenticados via Supabase Auth).</li>
            <li><strong>Dados de negócio:</strong> informações de clientes, contatos, campanhas e conteúdos cadastrados na plataforma.</li>
            <li><strong>Tokens de acesso às redes sociais:</strong> tokens OAuth do Facebook e Instagram fornecidos pelo usuário para integração com as APIs da Meta — usados exclusivamente para realizar ações autorizadas pelo próprio usuário (publicar posts, agendar conteúdos, ler métricas e gerenciar anúncios).</li>
            <li><strong>Dados de uso:</strong> logs de acesso, interações com a plataforma e informações de sessão para segurança e melhorias do serviço.</li>
            <li><strong>Dados de Inteligência Artificial:</strong> mensagens trocadas com a assistente Caroline IA, processadas pela API da Anthropic (Claude), sem armazenamento permanente pela Anthropic.</li>
          </ul>
        </Section>

        <Section title="3. Como usamos seus dados">
          <ul className="list-disc list-inside space-y-2 text-white/80">
            <li>Autenticar e manter sua sessão na plataforma.</li>
            <li>Gerenciar publicações, agendamentos e campanhas nas páginas e perfis conectados à sua conta Meta.</li>
            <li>Exibir métricas e relatórios de desempenho das suas redes sociais e campanhas de anúncios.</li>
            <li>Processar requisições à assistente de IA Caroline.</li>
            <li>Enviar notificações operacionais sobre a plataforma (sem fins publicitários).</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>
          <p className="mt-4 text-white/60 text-sm">
            Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins comerciais.
          </p>
        </Section>

        <Section title="4. Integrações com terceiros">
          <p className="text-white/80 mb-3">
            A plataforma utiliza os seguintes serviços externos, cada um com sua própria política de privacidade:
          </p>
          <ul className="list-disc list-inside space-y-2 text-white/80">
            <li><strong>Meta (Facebook & Instagram):</strong> para publicação, agendamento e relatórios via Graph API.</li>
            <li><strong>Supabase:</strong> banco de dados e autenticação, hospedado em infraestrutura segura.</li>
            <li><strong>Anthropic (Claude):</strong> processamento de linguagem natural para a Caroline IA.</li>
            <li><strong>Google Ads (futuro):</strong> gestão de campanhas de anúncios no Google.</li>
          </ul>
        </Section>

        <Section title="5. Permissões da API Meta utilizadas">
          <p className="text-white/80 mb-3">
            Ao conectar sua conta Meta, você autoriza explicitamente o uso das seguintes permissões:
          </p>
          <ul className="list-disc list-inside space-y-2 text-white/80">
            <li><code className="bg-white/10 px-1 rounded text-sm">pages_manage_posts</code> — publicar e agendar posts nas páginas do Facebook.</li>
            <li><code className="bg-white/10 px-1 rounded text-sm">pages_read_engagement</code> — ler métricas e comentários das páginas.</li>
            <li><code className="bg-white/10 px-1 rounded text-sm">pages_manage_engagement</code> — responder comentários em nome das páginas.</li>
            <li><code className="bg-white/10 px-1 rounded text-sm">instagram_basic</code> — acessar informações básicas do perfil do Instagram.</li>
            <li><code className="bg-white/10 px-1 rounded text-sm">instagram_content_publish</code> — publicar conteúdo no Instagram.</li>
            <li><code className="bg-white/10 px-1 rounded text-sm">instagram_manage_insights</code> — visualizar métricas do Instagram.</li>
            <li><code className="bg-white/10 px-1 rounded text-sm">ads_management</code> — criar e editar campanhas de anúncios.</li>
            <li><code className="bg-white/10 px-1 rounded text-sm">ads_read</code> — ler dados e resultados de campanhas.</li>
            <li><code className="bg-white/10 px-1 rounded text-sm">business_management</code> — gerenciar ativos do Business Manager vinculados.</li>
          </ul>
          <p className="mt-4 text-white/60 text-sm">
            Essas permissões são utilizadas exclusivamente para as funcionalidades descritas nesta política. O usuário pode revogar o acesso a qualquer momento diretamente nas configurações de apps da sua conta Meta.
          </p>
        </Section>

        <Section title="6. Retenção e exclusão de dados">
          <ul className="list-disc list-inside space-y-2 text-white/80">
            <li>Dados de conta são mantidos enquanto a conta estiver ativa.</li>
            <li>Tokens de acesso à Meta são armazenados de forma criptografada e revogados imediatamente após a desconexão da integração.</li>
            <li>Ao solicitar exclusão de conta, todos os seus dados são removidos em até 30 dias.</li>
            <li>Para solicitar exclusão, envie e-mail para <a href="mailto:carolinielucas.cl@gmail.com" className="text-[#B9FF4B] underline">carolinielucas.cl@gmail.com</a>.</li>
          </ul>
        </Section>

        <Section title="7. Seus direitos (LGPD)">
          <p className="text-white/80 mb-3">Em conformidade com a LGPD, você tem direito a:</p>
          <ul className="list-disc list-inside space-y-2 text-white/80">
            <li>Confirmar a existência de tratamento dos seus dados.</li>
            <li>Acessar seus dados pessoais.</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
            <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários.</li>
            <li>Revogar consentimento a qualquer momento.</li>
            <li>Solicitar portabilidade dos seus dados.</li>
          </ul>
          <p className="mt-4 text-white/60 text-sm">
            Para exercer qualquer desses direitos, entre em contato pelo e-mail{" "}
            <a href="mailto:carolinielucas.cl@gmail.com" className="text-[#B9FF4B] underline">
              carolinielucas.cl@gmail.com
            </a>
            . Responderemos em até 15 dias úteis.
          </p>
        </Section>

        <Section title="8. Segurança">
          <p className="text-white/80">
            Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acesso
            não autorizado, alteração, divulgação ou destruição. Utilizamos criptografia em trânsito (HTTPS)
            e em repouso para dados sensíveis como tokens de acesso.
          </p>
        </Section>

        <Section title="9. Alterações nesta política">
          <p className="text-white/80">
            Podemos atualizar esta política periodicamente. Notificaremos usuários ativos sobre mudanças
            significativas por e-mail ou via aviso na plataforma. O uso continuado da plataforma após as
            alterações implica concordância com a nova política.
          </p>
        </Section>

        <Section title="10. Contato">
          <p className="text-white/80">
            Calu Agência — Caroline Lucas<br />
            E-mail:{" "}
            <a href="mailto:carolinielucas.cl@gmail.com" className="text-[#B9FF4B] underline">
              carolinielucas.cl@gmail.com
            </a>
          </p>
        </Section>
      </main>

      <footer className="border-t border-white/10 text-center py-8 text-white/30 text-sm">
        © 2026 Calu Agência. Todos os direitos reservados.
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-[#B9FF4B] mb-3">{title}</h2>
      <div className="text-white/80 leading-relaxed">{children}</div>
    </section>
  );
}
