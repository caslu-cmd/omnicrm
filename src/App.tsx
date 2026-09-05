import { useEffect, lazy, Suspense, type ReactElement } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClientsProvider } from "@/contexts/ClientsContext";
import { SocialPostingProvider } from "@/contexts/SocialPostingContext";
import { PageContextProvider } from "@/contexts/PageContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import AiAssistant from "@/components/AiAssistant";
import AIFieldPanel from "@/components/AIFieldPanel";
import CookieConsent from "@/components/CookieConsent";
import { AIFieldProvider } from "@/contexts/AIFieldContext";
import AuthPage from "@/pages/AuthPage";
import LandingPage from "@/pages/LandingPage";
import NotFound from "@/pages/NotFound";

// Cada página vira um arquivo próprio: o primeiro carregamento traz só a tela
// pedida, em vez do app inteiro num bundle só.
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const InboxPage = lazy(() => import("@/pages/InboxPage"));
const ContactsPage = lazy(() => import("@/pages/ContactsPage"));
const PipelinesPage = lazy(() => import("@/pages/PipelinesPage"));
const AutomationsPage = lazy(() => import("@/pages/AutomationsPage"));
const CampaignsPage = lazy(() => import("@/pages/CampaignsPage"));
const SchedulingPage = lazy(() => import("@/pages/SchedulingPage"));
const VoicePage = lazy(() => import("@/pages/VoicePage"));
const SitesPage = lazy(() => import("@/pages/SitesPage"));
const MembersPage = lazy(() => import("@/pages/MembersPage"));
const PaymentsPage = lazy(() => import("@/pages/PaymentsPage"));
const ImportExportPage = lazy(() => import("@/pages/ImportExportPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const IntegrationsPage = lazy(() => import("@/pages/IntegrationsPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const HelpPage = lazy(() => import("@/pages/HelpPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const AgencyDashboard = lazy(() => import("@/pages/AgencyDashboard"));
const ClientWorkspace = lazy(() => import("@/pages/ClientWorkspace"));
const ClientPortal = lazy(() => import("@/pages/ClientPortal"));
const PublicFormPage = lazy(() => import("@/pages/PublicFormPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const OAuthCallbackPage = lazy(() => import("@/pages/OAuthCallbackPage"));
const VideoEditorPage = lazy(() => import("@/pages/VideoEditorPage"));
const TomasPage = lazy(() => import("@/pages/TomasPage"));
const TeoPage = lazy(() => import("@/pages/TeoPage"));
const BenPage = lazy(() => import("@/pages/BenPage"));
const ContaReportPage = lazy(() => import("@/pages/ContaReportPage"));
const ContaColaboradorPage = lazy(() => import("@/pages/ContaColaboradorPage"));
const SuperDiagnostico = lazy(() => import("@/pages/SuperDiagnostico"));
const InvitePage = lazy(() => import("@/pages/InvitePage"));
const TeamPortalPage = lazy(() => import("@/pages/TeamPortalPage"));
const WhatsAppPage = lazy(() => import("@/pages/WhatsAppPage"));
const BriefingPage = lazy(() => import("@/pages/BriefingPage"));
const GroupsPage = lazy(() => import("@/pages/GroupsPage"));
const NotebookPage = lazy(() => import("@/pages/NotebookPage"));
const ApostilaPage = lazy(() => import("@/pages/ApostilaPage"));
const WordPressPage = lazy(() => import("@/pages/WordPressPage"));
const FiscoPage = lazy(() => import("@/pages/FiscoPage"));
const FiscoCompartilhado = lazy(() => import("@/pages/FiscoCompartilhado"));
const AttendancePage = lazy(() => import("@/pages/AttendancePage"));
const PagesPage = lazy(() => import("@/pages/PagesPage"));
const PropostaPage = lazy(() => import("@/pages/PropostaPage"));
const PropostasPage = lazy(() => import("@/pages/PropostasPage"));
const CarrosselPage = lazy(() => import("@/pages/CarrosselPage"));
const SharedOrchestrationPage = lazy(() => import("@/pages/SharedOrchestrationPage"));
const FormsPage = lazy(() => import("@/pages/FormsPage"));
const SharedAgentPage = lazy(() => import("@/pages/SharedAgentPage"));
const SharedAgentChatPage = lazy(() => import("@/pages/SharedAgentChatPage"));
const TriagemSefazPage = lazy(() => import("@/pages/TriagemSefazPage"));
const RicoGuidePage = lazy(() => import("@/pages/RicoGuidePage"));

const CookiesPage = lazy(() => import("@/pages/CookiesPage"));

const queryClient = new QueryClient();

// ── Spinner reutilizável ──────────────────────────────────────
const Spinner = () => (
  <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080808" }}>
    <style>{`@keyframes _sp{to{transform:rotate(360deg)}}`}</style>
    <div style={{ width: 36, height: 36, border: "3px solid rgba(185,255,75,.15)", borderTopColor: "#B9FF4B", borderRadius: "50%", animation: "_sp .75s linear infinite" }} />
  </div>
);

// ── Guard para telas full-screen sem layout ───────────────────
const FullScreen = ({ page }: { page: ReactElement }) => {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/entrar" state={{ from: location }} replace />;
  return page;
};

// ── Rotas protegidas — exigem sessão ──────────────────────────
const ProtectedRoutes = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;

  if (!session) {
    return <Navigate to="/entrar" state={{ from: location }} replace />;
  }

  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/pipelines" element={<PipelinesPage />} />
          <Route path="/automations" element={<AutomationsPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/scheduling" element={<SchedulingPage />} />
          <Route path="/whatsapp" element={<WhatsAppPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/voice" element={<VoicePage />} />
          <Route path="/sites" element={<SitesPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/import-export" element={<ImportExportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/agency" element={<AgencyDashboard />} />
          <Route path="/agency/clients/:id" element={<ClientWorkspace />} />
          <Route path="/video-editor" element={<VideoEditorPage />} />
          <Route path="/ben" element={<BenPage />} />
          <Route path="/fisco" element={<FiscoPage />} />
          <Route path="/notebook" element={<NotebookPage />} />
          <Route path="/apostila" element={<ApostilaPage />} />
          <Route path="/wordpress" element={<WordPressPage />} />
          <Route path="/pages" element={<PagesPage />} />
          <Route path="/forms" element={<FormsPage />} />
          <Route path="/propostas" element={<PropostasPage />} />
          <Route path="/carrossel" element={<CarrosselPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <AiAssistant />
    </>
  );
};

// ── /entrar — redireciona pro dashboard se já logado ─────────
const EntrarRoute = () => {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (session) {
    const from = (location.state as any)?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }
  return <AuthPage />;
};

// ── /sair ────────────────────────────────────────────────────
const SairRoute = () => {
  const { signOut } = useAuth();
  useEffect(() => { signOut().then(() => window.location.replace("/")); }, []);
  return <Spinner />;
};

// ── Roteamento principal ──────────────────────────────────────
// O Suspense cobre o instante em que o arquivo da página está sendo baixado.
const AppRoutes = () => (
  <Suspense fallback={<Spinner />}>
  <Routes>
    {/* Única página pública para todos */}
    <Route path="/" element={<LandingPage />} />

    {/* Auth */}
    <Route path="/entrar" element={<EntrarRoute />} />
    <Route path="/auth" element={<EntrarRoute />} />
    {/* Atalho em inglês — quem digita /login cairia no 404 */}
    <Route path="/login" element={<Navigate to="/entrar" replace />} />
    <Route path="/sair" element={<SairRoute />} />

    {/* Portal do cliente (link externo enviado ao cliente) */}
    <Route path="/portal/:token" element={<ClientPortal />} />

    {/* Formulário público de captação (embutido/link em landing pages) */}
    <Route path="/f/:token" element={<PublicFormPage />} />

    {/* Super Diagnóstico Gratuito — funil de captação de leads */}
    <Route path="/super-diagnostico" element={<SuperDiagnostico />} />

    {/* Briefing interativo — captação de leads via Lia */}
    <Route path="/briefing" element={<BriefingPage />} />

    {/* Lista de presença — pública para alunos */}
    <Route path="/presenca/:courseId" element={<AttendancePage />} />
    <Route path="/presenca/:courseId/:day" element={<AttendancePage />} />

    {/* Propostas comerciais — acesso público por slug */}
    <Route path="/proposta/:slug" element={<PropostaPage />} />
    {/* Public shared orchestration report — no auth required */}
    <Route path="/shared/:token" element={<SharedOrchestrationPage />} />
    {/* Public shared agent output — no auth required */}
    <Route path="/agente/:token" element={<SharedAgentPage />} />
    {/* Public interactive agent chat — no auth required */}
    <Route path="/conversar/:token" element={<SharedAgentChatPage />} />

    {/* Fisco compartilhado — só a tela do agente, com senha e sem a barra da agência */}
    <Route path="/fisco/:token" element={<FiscoCompartilhado />} />

    {/* Convite para membros do time do cliente */}
    <Route path="/invite/:token" element={<InvitePage />} />

    {/* Portal do time do cliente (pós-aceite) */}
    <Route path="/team-portal/:clientId" element={<TeamPortalPage />} />

    {/* OAuth callbacks */}
    <Route path="/oauth/meta" element={<OAuthCallbackPage />} />
    <Route path="/oauth/linkedin" element={<OAuthCallbackPage />} />
    <Route path="/oauth/google" element={<OAuthCallbackPage />} />

    {/* Páginas legais */}
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="/cookies" element={<CookiesPage />} />
    <Route path="/terms" element={<TermsPage />} />

    {/* Telas exclusivas sem sidebar — exigem sessão */}
    <Route path="/conta-report" element={<FullScreen page={<ContaReportPage />} />} />
    <Route path="/rico-guide" element={<RicoGuidePage />} />
    <Route path="/triagem-sefaz" element={<FullScreen page={<TriagemSefazPage />} />} />
    <Route path="/conta-colaborador" element={<FullScreen page={<ContaColaboradorPage />} />} />
    <Route path="/tomas" element={<FullScreen page={<TomasPage />} />} />
    <Route path="/teo" element={<FullScreen page={<TeoPage />} />} />

    {/* Tudo mais exige autenticação */}
    <Route path="*" element={<ProtectedRoutes />} />
  </Routes>
  </Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ClientsProvider>
            <PageContextProvider>
              <SocialPostingProvider>
                <AIFieldProvider>
                  <AppRoutes />
                  <AIFieldPanel />
                  <CookieConsent />
                </AIFieldProvider>
              </SocialPostingProvider>
            </PageContextProvider>
          </ClientsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
