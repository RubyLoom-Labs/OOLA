import React from 'react'
import CompanyViewDrawer from '@/components/companies/CompanyViewDrawer'
import type { Customer } from '@/apis/customersApi'

export interface CustomerViewDrawerProps {
  customer: Customer | null
  isOpen: boolean
  onClose: () => void
  initialEditMode?: boolean
  onSave?: (updatedCustomer: Customer) => void
  onDelete: (customerId: number) => void
  onRestore?: (customerId: number) => void
}

export default function CustomerViewDrawer({
  customer,
  isOpen,
  onClose,
  initialEditMode = false,
  onSave,
  onDelete,
  onRestore,
}: CustomerViewDrawerProps) {
  return (
    <CompanyViewDrawer
      company={customer}
      isOpen={isOpen}
      onClose={onClose}
      initialEditMode={initialEditMode}
      onSave={onSave}
      onDelete={onDelete}
      onRestore={onRestore}
    />
  )
}
