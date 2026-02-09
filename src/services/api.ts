const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Map backend invoice status to frontend status
function mapInvoiceStatus(status: string): 'paid' | 'pending' | 'overdue' {
  switch (status) {
    case 'paid':
      return 'paid';
    case 'sent':
    case 'draft':
    case 'partially_paid':
      return 'pending';
    case 'overdue':
      return 'overdue';
    default:
      return 'pending';
  }
}

class ApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async request<T>(url: string, options: RequestInit & { params?: Record<string, any> } = {}): Promise<ApiResponse<T>> {
    try {
      // Handle query params
      let urlWithParams = url;
      if (options.params) {
        const searchParams = new URLSearchParams();
        Object.entries(options.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, value.toString());
          }
        });
        urlWithParams = `${url}?${searchParams.toString()}`;
      }
      
      const response = await fetch(`${API_BASE_URL}${urlWithParams}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        // If unauthorized, try to refresh token or redirect to login
        if (response.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_data');
          window.location.href = '/login';
          return { error: 'Authentication required' };
        }
        
        const errorMessage = await response.text().catch(() => `HTTP error! status: ${response.status}`);
        throw new ApiError(response.status, errorMessage);
      }

      // Handle responses that might not have JSON content (like DELETE requests)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return { data };
      } else {
        // For non-JSON responses (like DELETE), return success with no data
        return { data: null };
      }
    } catch (error) {
      console.error('API Error:', error);
      if (error instanceof ApiError) {
        return { error: error.message };
      }
      return { error: error instanceof Error ? error.message : 'An error occurred' };
    }
  }

  // Dashboard
  async getDashboardStats() {
    return this.request<{
      expected: number;
      collected: number;
      outstanding: number;
      overdue: number;
      pending: number;
      tenantCount: number;
    }>('/dashboard/stats/');
  }

  async getRecentPayments() {
    return this.request<Array<{
      id: number;
      tenant: string;
      unit: string;
      amount: number;
      date: string;
      method: string;
    }>>('/dashboard/recent-payments/');
  }

  async getOverdueTenants() {
    return this.request<Array<{
      id: number;
      name: string;
      unit: string;
      amount: number;
      daysOverdue: number;
    }>>('/dashboard/overdue-tenants/');
  }

  // Tenants
  async getTenants() {
    const response = await this.request<{
      count: number;
      next: string | null;
      previous: string | null;
      results: Array<{
        id: number;
        name: string;
        email: string;
        phone: string;
        unit: string;
        monthly_rent: number;
        status: string;
        payment_status: 'paid' | 'pending' | 'overdue';
        lease_start: string;
        lease_end: string;
      }>;
    }>('/tenants/');
    
    // Handle paginated response and map backend fields to frontend expectations
    if (response.data && response.data.results) {
      const mappedData = response.data.results.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone || '',
        unit: tenant.unit,
        rent: tenant.monthly_rent,
        status: tenant.payment_status,
        leaseStart: (tenant.lease_start && tenant.lease_start !== 'null' && tenant.lease_start !== 'None') ? tenant.lease_start : '',
        leaseEnd: (tenant.lease_end && tenant.lease_end !== 'null' && tenant.lease_end !== 'None') ? tenant.lease_end : ''
      }));
      
      return { data: mappedData } as ApiResponse<Array<{
        id: number;
        name: string;
        email: string;
        phone: string;
        unit: string;
        rent: number;
        status: 'paid' | 'pending' | 'overdue';
        leaseStart: string;
        leaseEnd: string;
      }>>;
    }
    
    return response as ApiResponse<Array<{
      id: number;
      name: string;
      email: string;
      phone: string;
      unit: string;
      rent: number;
      status: 'paid' | 'pending' | 'overdue';
      leaseStart: string;
      leaseEnd: string;
    }>>;
  }

  async getTenant(id: number) {
    const response = await this.request<{
      id: number;
      name: string;
      email: string;
      phone: string;
      unit: string;
      monthly_rent: number;
      payment_status: 'paid' | 'pending' | 'overdue';
      lease_start: string;
      lease_end: string;
    }>(`/tenants/${id}/`);
    
    // Map backend fields to frontend expectations
    if (response.data) {
      const tenant = response.data;
      return {
        data: {
          id: tenant.id,
          name: tenant.name,
          email: tenant.email,
          phone: tenant.phone || '',
          unit: tenant.unit,
          rent: tenant.monthly_rent,
          status: tenant.payment_status,
          leaseStart: tenant.lease_start && tenant.lease_start !== 'null' && tenant.lease_start !== 'None' ? tenant.lease_start : '',
          leaseEnd: tenant.lease_end && tenant.lease_end !== 'null' && tenant.lease_end !== 'None' ? tenant.lease_end : ''
        }
      };
    }
    
    return response;
  }

  async createTenant(data: {
    name: string;
    email: string;
    phone: string;
    unit: string;
    rent: number;
    leaseStart: string;
    leaseEnd: string;
  }) {
    // Map frontend fields to backend expectations
    const backendData: any = {
      name: data.name,
      email: data.email,
      unit: data.unit,
      monthly_rent: data.rent,
      status: 'active'
    };
    
    // Only include lease dates if they're not empty
    if (data.leaseStart && data.leaseStart.trim()) {
      backendData.lease_start = data.leaseStart;
    }
    if (data.leaseEnd && data.leaseEnd.trim()) {
      backendData.lease_end = data.leaseEnd;
    }
    
    
    // Only include phone if it's not empty
    // Format phone for Jamaica if provided
    if (data.phone && data.phone.trim()) {
      let formattedPhone = data.phone.trim();
      // If it doesn't start with +, assume it's a Jamaican number
      if (!formattedPhone.startsWith('+')) {
        // Remove any non-digit characters
        formattedPhone = formattedPhone.replace(/\D/g, '');
        // Add Jamaica country code if not present
        if (!formattedPhone.startsWith('1876') && !formattedPhone.startsWith('876')) {
          formattedPhone = '+1876' + formattedPhone;
        } else if (formattedPhone.startsWith('876')) {
          formattedPhone = '+1' + formattedPhone;
        } else if (formattedPhone.startsWith('1876')) {
          formattedPhone = '+' + formattedPhone;
        }
      }
      backendData.phone = formattedPhone;
    }
    
    return this.request('/tenants/', {
      method: 'POST',
      body: JSON.stringify(backendData),
    });
  }

  async updateTenant(id: number, data: Partial<{
    name: string;
    email: string;
    phone: string;
    unit: string;
    rent: number;
    leaseStart: string;
    leaseEnd: string;
  }>) {
    // Map frontend fields to backend expectations
    const backendData: any = {};
    
    if (data.name) backendData.name = data.name;
    if (data.email) backendData.email = data.email;
    if (data.unit) backendData.unit = data.unit;
    if (data.rent) backendData.monthly_rent = data.rent;
    if (data.leaseStart) backendData.lease_start = data.leaseStart;
    if (data.leaseEnd) backendData.lease_end = data.leaseEnd;
    
    
    // Handle phone formatting
    if (data.phone !== undefined) {
      if (data.phone && data.phone.trim()) {
        let formattedPhone = data.phone.trim();
        if (!formattedPhone.startsWith('+')) {
          formattedPhone = formattedPhone.replace(/\D/g, '');
          if (!formattedPhone.startsWith('1876') && !formattedPhone.startsWith('876')) {
            formattedPhone = '+1876' + formattedPhone;
          } else if (formattedPhone.startsWith('876')) {
            formattedPhone = '+1' + formattedPhone;
          } else if (formattedPhone.startsWith('1876')) {
            formattedPhone = '+' + formattedPhone;
          }
        }
        backendData.phone = formattedPhone;
      } else {
        backendData.phone = '';
      }
    }
    
    return this.request(`/tenants/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(backendData),
    });
  }

  async deleteTenant(id: number) {
    return this.request(`/tenants/${id}/`, {
      method: 'DELETE',
    });
  }

  // Payments
  async getPayments() {
    const response = await this.request<{
      count: number;
      next: string | null;
      previous: string | null;
      results: Array<{
        id: number;
        tenant: { name: string; unit: string };
        amount: number;
        payment_date: string;
        payment_method: string;
        status: string;
        reference_number: string;
      }>;
    }>('/payments/');
    
    // Handle paginated response and map fields
    if (response.data && response.data.results) {
      const mappedData = response.data.results.map(payment => ({
        id: payment.id,
        tenant: typeof payment.tenant === 'object' ? payment.tenant.name : payment.tenant,
        unit: typeof payment.tenant === 'object' ? payment.tenant.unit : '',
        amount: payment.amount,
        date: new Date(payment.payment_date).toLocaleDateString(),
        method: payment.payment_method,
        status: payment.status,
        receipt: payment.reference_number
      }));
      
      return { data: mappedData };
    }
    
    return { data: [] };
  }

  async createPayment(data: {
    tenantId: number;
    amount: number;
    date: string;
    method: string;
  }) {
    const backendData = {
      tenant: data.tenantId,
      amount: data.amount,
      payment_date: data.date,
      payment_method: data.method,
      status: 'completed'
    };
    
    return this.request('/payments/', {
      method: 'POST',
      body: JSON.stringify(backendData),
    });
  }

  // Invoices
  async getInvoices() {
    const response = await this.request<{
      count: number;
      next: string | null;
      previous: string | null;
      results: Array<{
        id: number;
        invoice_number: string;
        tenant_name: string;
        tenant_unit: string;
        amount: number;
        due_date: string;
        status: string;
        issue_date: string;
      }>;
    }>('/invoices/');
    
    // Handle paginated response and map fields
    if (response.data && response.data.results) {
      const mappedData = response.data.results.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        tenant: invoice.tenant_name || '',
        unit: invoice.tenant_unit || '',
        amount: invoice.amount,
        dueDate: invoice.due_date,
        status: mapInvoiceStatus(invoice.status),
        issuedDate: invoice.issue_date
      }));
      
      return { data: mappedData };
    }
    
    return { data: [] };
  }

  async createInvoice(data: {
    tenantId: number;
    amount: number;
    dueDate: string;
  }) {
    const backendData = {
      tenant: data.tenantId,
      amount: data.amount,
      due_date: data.dueDate,
      status: 'sent'
    };
    
    return this.request('/invoices/', {
      method: 'POST',
      body: JSON.stringify(backendData),
    });
  }

  async sendReminder(tenantId: number) {
    return this.request(`/tenants/${tenantId}/remind/`, {
      method: 'POST',
    });
  }

  // HandyPay Integration
  async createPaymentLink(invoiceId: number) {
    return this.request<{
      success: boolean;
      payment_link?: string;
      payment_id?: string;
      message: string;
    }>('/create-payment-link/', {
      method: 'POST',
      body: JSON.stringify({
        invoice_id: invoiceId
      }),
    });
  }

  async getPaymentStatus(paymentId: string) {
    return this.request<{
      success: boolean;
      payment_status?: string;
      payment_data?: any;
      message?: string;
    }>(`/payment-status/${paymentId}/`);
  }
}

export const api = new ApiService();

// Export the type for use in components
export type { ApiResponse };