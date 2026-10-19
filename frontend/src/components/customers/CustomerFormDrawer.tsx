import React from 'react'
import CompanyFormDrawer from '@/components/companies/CompanyFormDrawer'
import type { Customer, CreateCustomerPayload, UpdateCustomerPayload } from '@/apis/customersApi'

export interface CustomerFormDrawerProps {
  isOpen: boolean
  onClose: () => void
  customer?: Customer | null
  onSubmit: (
    payload: CreateCustomerPayload | UpdateCustomerPayload,
    isEdit: boolean
  ) => Promise<void>
}

export default function CustomerFormDrawer({
  isOpen,
  onClose,
  customer,
  onSubmit,
}: CustomerFormDrawerProps) {
  return (
    <CompanyFormDrawer
      isOpen={isOpen}
      onClose={onClose}
      company={customer}
      onSubmit={onSubmit}
    />
  )
}
