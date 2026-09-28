import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Dashboard from '@/pages/Dashboard'
import Leads from '@/pages/Leads'
import CreateQuotation from '@/pages/quotes/CreateQuotation'
import PlaceholderPage from '@/pages/PlaceholderPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route
            path="/contacts"
            element={
              <PlaceholderPage
                title="Contacts"
                description="Manage your customer contacts and relationships."
                breadcrumb={[{ label: 'Contacts' }]}
              />
            }
          />
          <Route
            path="/accounts"
            element={
              <PlaceholderPage
                title="Accounts"
                description="Manage customer accounts and companies."
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
          <Route
            path="/projects"
            element={
              <PlaceholderPage
                title="Projects"
                description="Manage your project portfolio."
                breadcrumb={[{ label: 'Projects' }]}
              />
            }
          />
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
      </Routes>
    </BrowserRouter>
  )
}

export default App
