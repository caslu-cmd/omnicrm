import { Link } from "react-router-dom";

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold mb-2">Termos de Serviço</h1>
        <p className="text-white/40 text-sm mb-12">Última atualização: 28 de abril de 2026</p>

        <Section title="1. Aceitação dos termos">
          <p>
            Ao acessar ou utilizar a plataforma <strong className="text-[#B9FF4B]">Calu Agência</strong>{" "}
            (disponível em <strong>omnicrm.lovable.app</strong>), você concorda com estes Termos de Serviço.
            Caso não concorde com qualquer disposição, não utilize a plataforma.
          </p>
          <p className="mt-3">
            Estes termos regem o relacionamento entre a Calu Agência (doravante "nós" ou "Plataforma") e
            você, usuário (doravante "Usuário"), em conformidade com a legislação brasileira.
          </p>
        </Section>

        <Section title="2. Descrição do serviço">
          <p>
            A Calu Agência é uma plataforma de gestão para agências de marketing digital, que oferece as
            seguintes ferramentas:
          </p>
          <ul className="list-disc list-inside space-y-2 text-white/80 mt-3">
            <li><strong>CRM:</strong> gestão de contatos, leads e pipelines de vendas.</li>
            <li><strong>Criação de Conteúdo:</strong> planejamento e aprovação de posts.</li>
            <li><strong>Agendamento de Posts:</strong> publicação automática no Facebook e Instagram.</li>
            <li><strong>Campanhas:</strong> gestão de anúncios no Facebook Ads e Google Ads.</li>
            <li><strong>Relatórios:</strong> dashboards de desempenho e métricas.</li>
            <li><strong>Calu IA:</strong> assistente de inteligência artificial para operações da agência.</li>
            <li><strong>Portal do Cliente:</strong> interface de aprovação de conteúdo para clientes da agência.</li>
          </ul>
        </Section>

        <Section title="3. Cadastro e conta">
          <ul className="list-disc list-inside space-y-2 text-white/80">
            <li>O Usuário deve fornecer informações verdadeiras, completas e atualizadas no cadastro.</li>
            <li>O Usuário é responsável por manter a confidencialidade de suas credenciais de acesso.</li>
            <li>Atividades realizadas sob a conta do Usuário são de responsabilidade exclusiva do Usuário.</li>
            <li>Comunicar imediatamente qualquer uso não autorizado da conta pelo e-mail{" "}
              <a href="mailto:carolinielucas.cl@gmail.com" className="text-[#B9FF4B] underline">
                carolinielucas.cl@gmail.com
              </a>.
            </li>
          </ul>
        </Section>

        <Section title="4. Integração com plataformas Meta (Facebook e Instagram)">
          <p className="text-white/80 mb-3">
            A plataforma permite integração com as APIs do Facebook e Instagram. Ao conectar suas contas:
          </p>
          <ul className="list-disc list-inside space-y-2 text-white/80">
            <li>Você autoriza a Plataforma a acessar e gerenciar páginas, perfis e contas de anúncio nos limites das permissões concedidas.</li>
            <li>Você declara ter autoridade legal para administrar as páginas e contas conectadas.</li>
            <li>O uso da integração deve respeitar as <a href="https://developers.facebook.com/terms/" target="_blank" rel="noopener noreferrer" className="text-[#B9FF4B] underline">Políticas da Plataforma Meta para Desenvolvedores</a> e os <a href="https://www.facebook.com/terms.php" target="_blank" rel="noopener noreferrer" className="text-[#B9FF4B] underline">Termos de Serviço do Facebook</a>.</li>
            <li>A Plataforma não se responsabiliza por suspensões ou restrições impostas pela Meta às contas do Usuário por violação das políticas da Meta.</li>
          </ul>
        </Section>

        <Section title="5. Uso permitido">
          <p className="text-white/80 mb-3">O Usuário concorda em utilizar a Plataforma exclusivamente para fins lícitos e comprometendo-se a não:</p>
          <ul className="list-disc list-inside space-y-2 text-white/80">
            <li>Publicar conteúdo ilegal, ofensivo, discriminatório, enganoso ou que viole direitos de terceiros.</li>
            <li>Utilizar a Plataforma para práticas de spam ou envio massivo de mensagens não solicitadas.</li>
            <li>Tentar acessar sistemas, dados ou contas de outros usuários sem autorização.</li>
            <li>Realizar engenharia reversa, descompilar ou tentar extrair o código-fonte da Plataforma.</li>
            <li>Usar a Plataforma para qualquer atividade que viole leis brasileiras ou internacionais aplicáveis.</li>
          </ul>
        </Section>

        <Section title="6. Propriedade intelectual">
          <p className="text-white/80">
            Todos os direitos sobre a Plataforma, incluindo marca, logotipos, design, código-fonte e
            funcionalidades, pertencem à Calu Agência. O Usuário recebe uma licença limitada, não exclusiva
            e intransferível para utilizar a Plataforma conforme estes Termos.
          </p>
          <p className="mt-3 text-white/80">
            Os conteúdos criados e publicados pelo Usuário por meio da Plataforma permanecem de
            propriedade do Usuário ou de seus clientes, conforme acordado entre as partes.
          </p>
        </Section>

        <Section title="7. Planos, pagamentos e cancelamento">
          <ul className="list-disc list-inside space-y-2 text-white/80">
            <li>A Plataforma pode oferecer planos gratuitos e pagos, com funcionalidades diferenciadas.</li>
            <li>Condições de preço, renovação e cancelamento são especificadas no momento da contratação.</li>
            <li>O cancelamento pode ser solicitado a qualquer momento, sem multa, com efeito ao final do período já pago.</li>
            <li>Não há reembolso proporcional por períodos não utilizados, salvo disposição legal contrária.</li>
          </ul>
        </Section>

        <Section title="8. Limitação de responsabilidade">
          <p className="text-white/80 mb-3">A Plataforma é fornecida "como está". Não nos responsabilizamos por:</p>
          <ul className="list-disc list-inside space-y-2 text-white/80">
            <li>Perdas de dados decorrentes de falhas técnicas ou uso incorreto pelo Usuário.</li>
            <li>Resultados de campanhas de anúncios ou performance de publicações nas redes sociais.</li>
            <li>Interrupções ou alterações nas APIs da Meta ou de outros terceiros integrados.</li>
            <li>Danos indiretos, incidentais ou consequentes decorrentes do uso ou impossibilidade de uso da Plataforma.</li>
          </ul>
          <p className="mt-4 text-white/60 text-sm">
            Nossa responsabilidade total, em qualquer hipótese, fica limitada ao valor pago pelo Usuário
            nos últimos 3 (três) meses anteriores ao evento causador do dano.
          </p>
        </Section>

        <Section title="9. Suspensão e encerramento">
          <p className="text-white/80">
            Podemos suspender ou encerrar o acesso do Usuário à Plataforma, com ou sem aviso prévio, em
            caso de violação destes Termos, comportamento abusivo, fraude, ou por determinação judicial ou
            regulatória.
          </p>
          <p className="mt-3 text-white/80">
            O Usuário pode encerrar sua conta a qualquer momento. Dados serão excluídos conforme descrito
            na nossa <Link to="/privacy" className="text-[#B9FF4B] underline">Política de Privacidade</Link>.
          </p>
        </Section>

        <Section title="10. Alterações nos termos">
          <p className="text-white/80">
            Reservamo-nos o direito de alterar estes Termos a qualquer momento. Usuários ativos serão
            notificados por e-mail ou via aviso na Plataforma com antecedência mínima de 10 dias para
            alterações relevantes. O uso continuado após as alterações implica aceitação dos novos Termos.
          </p>
        </Section>

        <Section title="11. Lei aplicável e foro">
          <p className="text-white/80">
            Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da Comarca de domicílio
            do Usuário para dirimir quaisquer conflitos decorrentes deste instrumento, com renúncia a qualquer
            outro, por mais privilegiado que seja.
          </p>
        </Section>

        <Section title="12. Contato">
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
