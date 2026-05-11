import { useEffect, type ReactElement } from "react";
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
import { AIFieldProvider } from "@/contexts/AIFieldContext";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import InboxPage from "@/pages/InboxPage";
import ContactsPage from "@/pages/ContactsPage";
import PipelinesPage from "@/pages/PipelinesPage";
import AutomationsPage from "@/pages/AutomationsPage";
import CampaignsPage from "@/pages/CampaignsPage";
import SchedulingPage from "@/pages/SchedulingPage";
import VoicePage from "@/pages/VoicePage";
import SitesPage from "@/pages/SitesPage";
import MembersPage from "@/pages/MembersPage";
import PaymentsPage from "@/pages/PaymentsPage";
import ImportExportPage from "@/pages/ImportExportPage";
import ReportsPage from "@/pages/ReportsPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import SettingsPage from "@/pages/SettingsPage";
import HelpPage from "@/pages/HelpPage";
import AdminPage from "@/pages/AdminPage";
import AgencyDashboard from "@/pages/AgencyDashboard";
import ClientWorkspace from "@/pages/ClientWorkspace";
import ClientPortal from "@/pages/ClientPortal";
import LandingPage from "@/pages/LandingPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import OAuthCallbackPage from "@/pages/OAuthCallbackPage";
import NotFound from "@/pages/NotFound";
import VideoEditorPage from "@/pages/VideoEditorPage";
import TomasPage from "@/pages/TomasPage";
import BenPage from "@/pages/BenPage";
import ContaReportPage from "@/pages/ContaReportPage";
import ContaColaboradorPage from "@/pages/ContaColaboradorPage";
import SuperDiagnostico from "@/pages/SuperDiagnostico";
import InvitePage from "@/pages/InvitePage";
import TeamPortalPage from "@/pages/TeamPortalPage";
import WhatsAppPage from "@/pages/WhatsAppPage";
import BriefingPage from "@/pages/BriefingPage";
import GroupsPage from "@/pages/GroupsPage";
import NotebookPage from "@/pages/NotebookPage";
import ApostilaPage from "@/pages/ApostilaPage";
import WordPressPage from "@/pages/WordPressPage";

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
          <Route path="/tomas" element={<TomasPage />} />
          <Route path="/ben" element={<BenPage />} />
          <Route path="/notebook" element={<NotebookPage />} />
          <Route path="/apostila" element={<ApostilaPage />} />
          <Route path="/wordpress" element={<WordPressPage />} />
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
const AppRoutes = () => (
  <Routes>
    {/* Única página pública para todos */}
    <Route path="/" element={<LandingPage />} />

    {/* Auth */}
    <Route path="/entrar" element={<EntrarRoute />} />
    <Route path="/auth" element={<EntrarRoute />} />
    <Route path="/sair" element={<SairRoute />} />

    {/* Portal do cliente (link externo enviado ao cliente) */}
    <Route path="/portal/:token" element={<ClientPortal />} />

    {/* Super Diagnóstico Gratuito — funil de captação de leads */}
    <Route path="/super-diagnostico" element={<SuperDiagnostico />} />

    {/* Briefing interativo — captação de leads via Lia */}
    <Route path="/briefing" element={<BriefingPage />} />

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
    <Route path="/terms" element={<TermsPage />} />

    {/* Telas exclusivas sem sidebar — exigem sessão */}
    <Route path="/conta-report" element={<FullScreen page={<ContaReportPage />} />} />
    <Route path="/conta-colaborador" element={<FullScreen page={<ContaColaboradorPage />} />} />

    {/* Tudo mais exige autenticação */}
    <Route path="*" element={<ProtectedRoutes />} />
  </Routes>
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
