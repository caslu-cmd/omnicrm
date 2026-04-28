import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClientsProvider } from "@/contexts/ClientsContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoutes = () => {
  const { session, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!session) return <Navigate to="/auth" replace />;
  
  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
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
      {/* Páginas públicas */}
      <Route path="/portal/:clientId" element={<ClientPortal />} />
      <Route path="/portal" element={<ClientPortal />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/briefing" element={<BriefingPage />} />
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
