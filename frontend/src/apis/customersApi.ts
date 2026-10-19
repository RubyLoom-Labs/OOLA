/**
 * Customers Module API Service (Alias / Compatibility Layer)
 * Re-exports everything from companiesApi to ensure complete backward compatibility.
 */

import {
  companiesApi,
  normalizeCompany,
  type Company,
  type CompanyQueryParams,
  type CreateCompanyPayload,
  type UpdateCompanyPayload,
  type CompanyTypeItem,
  type CompanySizeItem,
  type CompanyContact,
  type CompanyLookupItem,
  type CompanyLookupParams,
} from './companiesApi'

export type Customer = Company
export type CustomerQueryParams = CompanyQueryParams
export type CreateCustomerPayload = CreateCompanyPayload
export type UpdateCustomerPayload = UpdateCompanyPayload
export type { CompanyTypeItem, CompanySizeItem, CompanyContact, CompanyLookupItem, CompanyLookupParams }

export const normalizeCustomer = normalizeCompany

export const customersApi = {
  ...companiesApi,
  getCustomers: companiesApi.getCompanies,
  getCustomer: companiesApi.getCompany,
  createCustomer: companiesApi.createCompany,
  updateCustomer: companiesApi.updateCompany,
  deleteCustomer: companiesApi.deleteCompany,
}

export default customersApi
