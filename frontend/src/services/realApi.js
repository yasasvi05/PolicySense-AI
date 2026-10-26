// Real FastAPI client. Endpoint list matches the project brief.
import { http } from './http'

export const realApi = {
  login: (email, password) => http('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (payload) => http('/api/auth/register', { method: 'POST', body: payload }),
  getProfile: () => http('/api/customer/profile'),
  getBankingOverview: () => http('/api/customer/banking/overview'),
  updateProfile: (changes) => http('/api/customer/profile', { method: 'PATCH', body: changes }),
  getPolicies: () => http('/api/customer/policies'), 
  getPayments: () => http('/api/customer/payments'),
  getRenewals: () => http('/api/customer/renewals'),
  getClaims: () => http('/api/customer/claims'),
  getNotifications: () => http('/api/customer/notifications'),
  queryAssistant: ({ message, context }) => http('/api/assistant/query', { method: 'POST', body: { message, context } }),
  getSources: (queryId) => http(`/api/assistant/sources?query_id=${queryId}`),
  sendFeedback: (query_id, value) => http('/api/assistant/feedback', { method: 'POST', body: { query_id, value } }),
  getDocuments: () => http('/api/admin/documents'),
  uploadDocument: (file, policyType, domain = 'insurance') => {
  const form = new FormData()
  form.append('file', file)
  form.append('policy_type', policyType)
  form.append('domain', domain)
  return http('/api/admin/documents/upload', {
    method: 'POST',
    form,
  })
},
  deleteDocument: (id) => http(`/api/admin/documents/${id}`, { method: 'DELETE' }),
  getCustomers: () => http('/api/admin/customers'),
  getCustomer: (id) => http(`/api/admin/customers/${id}`),
  getAnalytics: () => http('/api/admin/analytics'),
}
