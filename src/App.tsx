import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClientsProvider } from "@/contexts/ClientsContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import AiAssistant from "@/components/AiAssistant";
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
import BriefingPage from "@/pages/BriefingPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import OAuthCallbackPage from "@/pages/OAuthCallbackPage";
import NotFound from "@/pages/NotFound";
import VideoEditorPage from "@/pages/VideoEditorPage";

// Singleton QueryClient
const queryClient = new QueryClient();

const ProtectedRoutes = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Raiz sempre mostra a LandingPage (logados e não logados)
  if (location.pathname === "/") return <LandingPage />;

  if (!session) {
    // Outras rotas protegidas: redireciona para landing
    return <Navigate to="/" replace />;
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
        </Route>
      </Routes>
      <AiAssistant />
    </>
  );
};

const AppRoutes = () => {
  const { session, loading } = useAuth();

  return (
    <Routes>
      <Route path="/auth" element={loading ? null : session ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/entrar" element={
        loading
          ? <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#080808"}}>
              <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{width:36,height:36,border:"3px solid rgba(185,255,75,.15)",borderTopColor:"#B9FF4B",borderRadius:"50%",animation:"_spin .75s linear infinite"}} />
            </div>
          : session ? <Navigate to="/" replace /> : <AuthPage />
      } />
      {/* Páginas públicas */}
      <Route path="/portal/:clientId" element={<ClientPortal />} />
      <Route path="/portal" element={<ClientPortal />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/briefing" element={<BriefingPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/oauth/meta" element={<OAuthCallbackPage />} />
      <Route path="/oauth/linkedin" element={<OAuthCallbackPage />} />
      <Route path="*" element={<ProtectedRoutes />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ClientsProvider>
            <AppRoutes />
          </ClientsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
