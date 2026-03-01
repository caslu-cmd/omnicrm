import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import InboxPage from "@/pages/InboxPage";
import ContactsPage from "@/pages/ContactsPage";
import PipelinesPage from "@/pages/PipelinesPage";
import AutomationsPage from "@/pages/AutomationsPage";
import CampaignsPage from "@/pages/CampaignsPage";
import SchedulingPage from "@/pages/SchedulingPage";
import SitesPage from "@/pages/SitesPage";
import MembersPage from "@/pages/MembersPage";
import PaymentsPage from "@/pages/PaymentsPage";
import ReportsPage from "@/pages/ReportsPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import SettingsPage from "@/pages/SettingsPage";
import HelpPage from "@/pages/HelpPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/pipelines" element={<PipelinesPage />} />
            <Route path="/automations" element={<AutomationsPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/scheduling" element={<SchedulingPage />} />
            <Route path="/sites" element={<SitesPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
