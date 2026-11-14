import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { NotificationProvider } from '@/context/NotificationContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import Login from '@/pages/Login'
import ResetPassword from '@/pages/ResetPassword'
import ForgotPassword from '@/pages/ForgotPassword'
import Dashboard from '@/pages/Dashboard'
import Leads from '@/pages/Leads'
import Contacts from '@/pages/Contacts'
import Users from '@/pages/Users'
import Companies from '@/pages/Companies'
import CreateQuotation from '@/pages/quotes/CreateQuotation'
import Projects from '@/pages/Projects'
import ProjectWorkspace from '@/pages/ProjectWorkspace'
import Inquiries from '@/pages/Inquiries'
import PlaceholderPage from '@/pages/PlaceholderPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected CRM Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/website" element={<Navigate to="/website/inquiry" replace />} />
              <Route path="/website/inquiry" element={<Inquiries />} />
              <Route path="/website/inquiries" element={<Inquiries />} />
              <Route path="/website/inquery" element={<Inquiries />} />
              <Route path="/inquiries" element={<Inquiries />} />
              <Route path="/inquery" element={<Inquiries />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/customers" element={<Navigate to="/companies" replace />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/users" element={<Users />} />
              <Route
                path="/accounts"
                element={
                  <PlaceholderPage
                    title="Accounts"
                    description="Manage company accounts and organizations."
                    breadcrumb={[{ label: 'Accounts' }]}
                  />
                }
              />
              <Route
                path="/deals"
                element={
                  <PlaceholderPage
                    title="Deals"
                    description="Track your deals and opportunities."
                    breadcrumb={[{ label: 'Deals' }]}
                  />
                }
              />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectWorkspace />} />
              <Route
                path="/tasks"
                element={
                  <PlaceholderPage
                    title="Tasks"
                    description="View and manage all tasks across projects and leads."
                    breadcrumb={[{ label: 'Tasks' }]}
                  />
                }
              />
              <Route
                path="/calendar"
                element={
                  <PlaceholderPage
                    title="Calendar"
                    description="Meetings, events, deadlines, and follow-ups."
                    breadcrumb={[{ label: 'Calendar' }]}
                  />
                }
              />
              <Route
                path="/emails"
                element={
                  <PlaceholderPage
                    title="Emails"
                    description="Email templates and communication history."
                    breadcrumb={[{ label: 'Emails' }]}
                  />
                }
              />
              <Route
                path="/invoices"
                element={
                  <PlaceholderPage
                    title="Invoices"
                    description="Manage invoices and payment tracking."
                    breadcrumb={[{ label: 'Invoices' }]}
                  />
                }
              />
              <Route path="/quotes" element={<CreateQuotation />} />
              <Route path="/quotes/drafts" element={<CreateQuotation />} />
              <Route path="/quotes/sent" element={<CreateQuotation />} />
              <Route path="/quotes/accepted" element={<CreateQuotation />} />
              <Route path="/quotes/rejected" element={<CreateQuotation />} />
              <Route
                path="/products"
                element={
                  <PlaceholderPage
                    title="Products"
                    description="Manage your product and service catalog."
                    breadcrumb={[{ label: 'Products' }]}
                  />
                }
              />
              <Route
                path="/reports"
                element={
                  <PlaceholderPage
                    title="Reports"
                    description="Sales, project, and financial analytics."
                    breadcrumb={[{ label: 'Reports' }]}
                  />
                }
              />
              <Route
                path="/automations"
                element={
                  <PlaceholderPage
                    title="Automations"
                    description="Configure workflow automations and triggers."
                    breadcrumb={[{ label: 'Automations' }]}
                  />
                }
              />
              <Route
                path="/settings"
                element={
                  <PlaceholderPage
                    title="Settings"
                    description="System configuration and preferences."
                    breadcrumb={[{ label: 'Settings' }]}
                  />
                }
              />
            </Route>
          </Route>

          {/* Fallback wildcard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
