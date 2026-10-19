import { useState, useEffect, useCallback } from 'react'
import {
  Building2,
  Plus,
  Search,
  LayoutGrid,
  List,
  CheckCircle,
  Clock,
  Eye,
  Edit2,
  Trash2,
  FolderKanban,
  Users,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import Breadcrumb from '@/components/ui/Breadcrumb'
import DataTable, { type Column } from '@/components/common/DataTable'
import ActionDropdown from '@/components/common/ActionDropdown'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import { capitalizeWords, getCompanyLogoUrl } from '@/lib/utils'
import CompanyViewDrawer from '@/components/companies/CompanyViewDrawer'
import CompanyFormDrawer from '@/components/companies/CompanyFormDrawer'
import {
  companiesApi,
  type Company,
  type CompanyQueryParams,
  type CreateCompanyPayload,
  type UpdateCompanyPayload,
} from '@/apis/companiesApi'

interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  active_count?: number
  inactive_count?: number
  company_count?: number
}

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Sorting state
  const [sortBy] = useState<string>('created_at')
  const [sortDir] = useState<'asc' | 'desc'>('desc')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    active_count: 0,
    inactive_count: 0,
    company_count: 0,
  })

  // Drawer / Modal states
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewDrawerInitialEdit, setViewDrawerInitialEdit] = useState(false)

  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Confirmation Modal state
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null)

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Debounce search input
  useEffect(() => {
    if (searchQuery === debouncedSearch) return
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, debouncedSearch])

  // Fetch Companies from GET /api/v1/companies
  const fetchCompaniesList = useCallback(async () => {
    setLoading(true)
    try {
      const params: CompanyQueryParams = {
        page: currentPage,
        per_page: perPage,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sort_by: sortBy,
        sort_dir: sortDir,
      }
      const res = await companiesApi.getCompanies(params)
      const dataList: Company[] = Array.isArray(res.data) ? res.data : []
      setCompanies(dataList)

      const activeCount = dataList.filter(
        (c) => c.status === 'Active' || c.status === true || c.status_bool === true
      ).length
      const inactiveCount = dataList.filter(
        (c) => c.status === 'Inactive' || c.status === false || c.status_bool === false
      ).length

      if (res.meta) {
        setMeta({
          current_page: res.meta.current_page || currentPage,
          last_page: res.meta.last_page || 1,
          per_page: res.meta.per_page || perPage,
          total: res.meta.total ?? dataList.length,
          active_count: res.meta.active_count ?? activeCount,
          inactive_count: res.meta.inactive_count ?? inactiveCount,
          company_count: res.meta.company_count ?? dataList.length,
        })
      } else {
        setMeta({
          current_page: currentPage,
          last_page: Math.max(1, Math.ceil(dataList.length / perPage)),
          per_page: perPage,
          total: dataList.length,
          active_count: activeCount,
          inactive_count: inactiveCount,
          company_count: dataList.length,
        })
      }
    } catch (err: any) {
      console.error('Error fetching companies from API:', err)
      setCompanies([])
      setMeta({
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        total: 0,
        active_count: 0,
        inactive_count: 0,
        company_count: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, perPage, debouncedSearch, statusFilter, sortBy, sortDir])

  useEffect(() => {
    fetchCompaniesList()
  }, [fetchCompaniesList])

  // Checkbox Selection
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(companies.map((c) => c.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // Handlers for CRUD Actions
  const handleOpenView = (company: Company) => {
    setViewingCompany(company)
    setViewDrawerInitialEdit(false)
    setIsViewOpen(true)
  }

  const handleOpenCreate = () => {
    setEditingCompany(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (company: Company) => {
    setViewingCompany(company)
    setViewDrawerInitialEdit(true)
    setIsViewOpen(true)
  }

  const handleFormSubmit = async (
    payload: CreateCompanyPayload | UpdateCompanyPayload,
    isEdit: boolean
  ) => {
    if (isEdit && editingCompany) {
      const res = await companiesApi.updateCompany(editingCompany.id, payload)
      showToast(`Company "${res.data?.company_name || payload.company_name}" updated successfully`)
      if (viewingCompany && viewingCompany.id === editingCompany.id) {
        setViewingCompany(res.data)
      }
    } else {
      const res = await companiesApi.createCompany(payload as CreateCompanyPayload)
      showToast(
        `Company "${res.data?.company_name || payload.company_name}" (${res.data?.company_code}) created successfully`
      )
    }
    fetchCompaniesList()
  }

  const handleDelete = (companyOrId: Company | number) => {
    if (typeof companyOrId === 'number') {
      const target = companies.find((c) => c.id === companyOrId) || viewingCompany
      if (target) {
        setCompanyToDelete(target)
      } else {
        setCompanyToDelete({
          id: companyOrId,
          company_name: `Company #${companyOrId}`,
        } as Company)
      }
    } else {
      setCompanyToDelete(companyOrId)
    }
  }

  const handleConfirmDelete = async () => {
    if (!companyToDelete) return
    const id = companyToDelete.id
    const companyName = companyToDelete.company_name
    try {
      await companiesApi.deleteCompany(id)
      showToast(`Company "${companyName}" archived successfully`)
      if (viewingCompany && viewingCompany.id === id) {
        setIsViewOpen(false)
      }
      setCompanyToDelete(null)
      fetchCompaniesList()
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to delete company')
    }
  }

  const getDisplayName = (company: Company) => {
    return capitalizeWords(company.company_name) || 'Company Account'
  }

  const getDisplayPhone = (company: Company) => {
    return company.phone_number || company.phone || '—'
  }

  const companyColumns: Column<Company>[] = [
    {
      key: 'name',
      header: 'COMPANY',
      render: (company) => {
        const displayName = getDisplayName(company)
        const typeName =
          typeof company.company_type === 'object'
            ? company.company_type?.name
            : company.company_type || 'Company'

        const logoUrl = getCompanyLogoUrl(company.logo, company.logo_url)

        return (
          <div className="contact-name-cell">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={displayName}
                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 bg-white shadow-2xs"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
            ) : null}
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs"
              style={{ display: logoUrl ? 'none' : 'flex' }}
            >
              {displayName.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="contact-table-name font-semibold text-slate-900 truncate">
                {displayName}
              </div>
              <div className="contact-table-designation text-muted text-xs truncate">
                {typeName}
                {company.industry ? ` • ${company.industry}` : ''}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      key: 'company_code',
      header: 'COMPANY CODE',
      render: (company) => (
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
          {company.company_code}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'EMAIL',
      render: (company) =>
        company.email ? (
          <a
            href={`mailto:${company.email}`}
            className="text-slate-600 hover:text-blue-600 text-sm hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {company.email}
          </a>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        ),
    },
    {
      key: 'phone',
      header: 'PHONE',
      render: (company) => {
        const phone = getDisplayPhone(company)
        return phone !== '—' ? (
          <a
            href={`tel:${phone}`}
            className="text-slate-600 hover:text-blue-600 text-sm font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {phone}
          </a>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )
      },
    },
    {
      key: 'location',
      header: 'LOCATION',
      render: (company) => (
        <span className="text-slate-600 text-sm">
          {[company.city, company.country].filter(Boolean).join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'contacts',
      header: 'CONTACTS',
      render: (company) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          <Users size={12} className="text-slate-500" />
          <span>{company.contacts_count ?? (company.contacts ? company.contacts.length : 0)}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (company) => {
        const isActive =
          company.status === 'Active' || company.status === true || company.status_bool === true
        return (
          <span
            className={`contact-status-pill ${isActive ? 'status-active' : 'status-neutral'
              }`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      width: 60,
      align: 'center',
      render: (company) => (
        <ActionDropdown
          minWidth={175}
          items={[
            {
              key: 'view',
              label: 'View Details',
              icon: <Eye size={14} />,
              onClick: () => handleOpenView(company),
            },
            {
              key: 'edit',
              label: 'Edit Company',
              icon: <Edit2 size={14} />,
              onClick: () => handleOpenEdit(company),
            },
            {
              key: 'divider',
              label: '',
              divider: true,
            },
            {
              key: 'delete',
              label: 'Delete Company',
              icon: <Trash2 size={14} />,
              danger: true,
              onClick: () => handleDelete(company),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="contacts-module-container animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="module-toast animate-slide-up">
          <CheckCircle size={16} className="text-success-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Companies' }]} />

      {/* Module Page Header */}
      <PageHeader
        icon={<Building2 size={24} />}
        title="Companies"
        description="Manage your client organizations and company accounts. Create, edit, and track company profiles."
        actions={
          <div className="flex items-center gap-2">
            <button
              id="add-company-btn"
              data-testid="add-company-btn"
              className="btn btn-primary shadow-sm flex items-center gap-1.5"
              onClick={handleOpenCreate}
            >
              <Plus size={16} />
              <span>Add Company</span>
            </button>
          </div>
        }
      />

      {/* Stat Cards Summary Row */}
      <div className="contacts-stats-grid">
        <StatCard
          label="Total Companies"
          value={meta.total}
          icon={<Building2 size={20} />}
          variant="blue"
          active={statusFilter === 'all'}
          onClick={() => {
            setStatusFilter('all')
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="Active"
          value={meta.active_count ?? 0}
          icon={<CheckCircle size={20} />}
          variant="green"
          active={statusFilter === 'Active'}
          onClick={() => {
            setStatusFilter('Active')
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="Inactive"
          value={meta.inactive_count ?? 0}
          icon={<Clock size={20} />}
          variant="amber"
          active={statusFilter === 'Inactive'}
          onClick={() => {
            setStatusFilter('Inactive')
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="Total Projects"
          value={companies.reduce((acc, c) => acc + (c.projects_count ?? 0), 0)}
          icon={<FolderKanban size={20} />}
          variant="purple"
        />
      </div>

      {/* Filter & Search Toolbar */}
      <div className="contacts-filter-bar">
        <div className="contacts-filter-left">
          {/* Status Dropdown Selector */}
          <div className="relative">
            <select
              className="form-select contacts-status-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any)
                setCurrentPage(1)
              }}
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Search Companies Bar */}
          <div className="contacts-search-box">
            <Search size={16} className="contacts-search-icon" />
            <input
              type="text"
              className="contacts-search-input"
              placeholder="Search by company name, code, email, phone, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="contacts-filter-right">
          {/* Per Page Selector */}
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span>Show:</span>
            <select
              className="form-select form-input-xs py-1"
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="view-mode-toggle-box">
            <button
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={15} />
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Table View vs Grid View */}
      {viewMode === 'table' ? (
        <DataTable<Company>
          data={companies}
          columns={companyColumns}
          loading={loading}
          loadingMessage="Loading companies from server..."
          emptyMessage="No companies found matching your criteria."
          selectable
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectRow={(id) => handleSelectOne(Number(id))}
          onRowClick={(company) => handleOpenView(company)}
          pagination={{
            currentPage,
            total: meta.total,
            perPage,
            lastPage: meta.last_page,
            onPageChange: setCurrentPage,
            itemName: 'companies',
          }}
        />
      ) : (
        /* Grid View Mode */
        <div className="contacts-cards-grid">
          {companies.map((company) => {
            const displayName = getDisplayName(company)
            const displayPhone = getDisplayPhone(company)
            const isActive =
              company.status === 'Active' || company.status === true || company.status_bool === true
            const typeName =
              typeof company.company_type === 'object'
                ? company.company_type?.name
                : company.company_type || 'Company'

            return (
              <div
                key={company.id}
                className="contact-grid-card cursor-pointer hover:shadow-md transition-all"
                onClick={() => handleOpenView(company)}
              >
                <div className="contact-grid-card-header">
                  {(() => {
                    const logoUrl = getCompanyLogoUrl(company.logo, company.logo_url)
                    return (
                      <>
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={displayName}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-white shadow-2xs"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement
                              if (fallback) fallback.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div
                          className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs"
                          style={{ display: logoUrl ? 'none' : 'flex' }}
                        >
                          {displayName.slice(0, 2)}
                        </div>
                      </>
                    )
                  })()}
                  <span
                    className={`contact-status-pill ${isActive ? 'status-active' : 'status-neutral'
                      }`}
                  >
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="contact-grid-name font-semibold text-slate-900 mt-2 truncate">
                  {displayName}
                </div>
                <div className="contact-grid-title flex items-center gap-1.5 text-xs text-muted mt-1">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    {company.company_code}
                  </span>
                  <span className="truncate">{typeName}</span>
                  {company.industry && <span className="truncate">• {company.industry}</span>}
                </div>
                <div className="contact-grid-meta text-xs text-slate-600 mt-3 space-y-1">
                  <div className="truncate">{company.email || '—'}</div>
                  <div>{displayPhone}</div>
                  <div className="text-slate-400">
                    {[company.city, company.country].filter(Boolean).join(', ') || '—'}
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-muted">
                  <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                    <Users size={12} className="text-slate-400" />
                    <span>{company.contacts_count ?? 0} Contacts</span>
                  </span>
                  <span className="text-blue-600 font-medium hover:underline">View details →</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Slide Drawer: View & In-Place Edit Company Details */}
      <CompanyViewDrawer
        company={viewingCompany}
        isOpen={isViewOpen}
        initialEditMode={viewDrawerInitialEdit}
        onClose={() => {
          setIsViewOpen(false)
          setViewDrawerInitialEdit(false)
        }}
        onSave={(updatedCompany) => {
          showToast(`Company "${updatedCompany.company_name}" updated successfully`)
          setViewingCompany(updatedCompany)
          fetchCompaniesList()
        }}
        onDelete={handleDelete}
      />

      {/* Slide Drawer: Create New Company */}
      <CompanyFormDrawer
        company={editingCompany}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Global Confirmation Modal for Deletion */}
      <ConfirmationModal
        isOpen={Boolean(companyToDelete)}
        onClose={() => setCompanyToDelete(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        title="Delete Company"
        itemName={companyToDelete ? getDisplayName(companyToDelete) : undefined}
        message="Are you sure you want to Delete this company? Associated records and contacts will be preserved."
        confirmText="Delete Company"
        cancelText="Cancel"
      />
    </div>
  )
}
