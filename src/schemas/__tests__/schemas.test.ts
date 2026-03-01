import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  signupSchema,
  addTenantSchema,
  updateTenantSchema,
  createInvoiceSchema,
  createPaymentSchema,
  updateProfileSchema,
  updateCompanyInfoSchema,
  updateBankDetailsSchema,
  createPropertySchema,
  createUnitSchema,
} from '../index';

describe('loginSchema', () => {
  it('accepts valid input', () => {
    const result = loginSchema.safeParse({ email: 'test@test.com', password: 'password' });
    expect(result.success).toBe(true);
  });

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'password' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'notanemail', password: 'password' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'test@test.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('signupSchema', () => {
  it('accepts valid input', () => {
    const result = signupSchema.safeParse({ firstName: 'John', lastName: 'Doe', email: 'john@test.com', password: 'secret123', confirmPassword: 'secret123' });
    expect(result.success).toBe(true);
  });

  it('rejects short password', () => {
    const result = signupSchema.safeParse({ firstName: 'John', lastName: 'Doe', email: 'john@test.com', password: '123', confirmPassword: '123' });
    expect(result.success).toBe(false);
  });

  it('rejects missing first name', () => {
    const result = signupSchema.safeParse({ firstName: '', lastName: 'Doe', email: 'john@test.com', password: 'secret123', confirmPassword: 'secret123' });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = signupSchema.safeParse({ firstName: 'John', lastName: 'Doe', email: 'john@test.com', password: 'secret123', confirmPassword: 'different' });
    expect(result.success).toBe(false);
  });
});

describe('addTenantSchema', () => {
  it('accepts valid input', () => {
    const result = addTenantSchema.safeParse({ firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com', phone: '555-1234' });
    expect(result.success).toBe(true);
  });

  it('accepts empty email', () => {
    const result = addTenantSchema.safeParse({ firstName: 'Jane', lastName: 'Smith', email: '' });
    expect(result.success).toBe(true);
  });

  it('rejects missing first name', () => {
    const result = addTenantSchema.safeParse({ firstName: '', lastName: 'Smith' });
    expect(result.success).toBe(false);
  });
});

describe('updateTenantSchema', () => {
  it('accepts partial updates', () => {
    const result = updateTenantSchema.safeParse({ first_name: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('accepts status values', () => {
    expect(updateTenantSchema.safeParse({ status: 'active' }).success).toBe(true);
    expect(updateTenantSchema.safeParse({ status: 'inactive' }).success).toBe(true);
    expect(updateTenantSchema.safeParse({ status: 'unknown' }).success).toBe(false);
  });
});

describe('createInvoiceSchema', () => {
  it('accepts valid input', () => {
    const result = createInvoiceSchema.safeParse({ tenant_id: 't1', amount: '50000', due_date: '2026-03-01' });
    expect(result.success).toBe(true);
  });

  it('rejects missing tenant', () => {
    const result = createInvoiceSchema.safeParse({ tenant_id: '', amount: '50000', due_date: '2026-03-01' });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive amount', () => {
    const result = createInvoiceSchema.safeParse({ tenant_id: 't1', amount: '0', due_date: '2026-03-01' });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric amount', () => {
    const result = createInvoiceSchema.safeParse({ tenant_id: 't1', amount: 'abc', due_date: '2026-03-01' });
    expect(result.success).toBe(false);
  });
});

describe('createPaymentSchema', () => {
  it('accepts valid input', () => {
    const result = createPaymentSchema.safeParse({ tenant_id: 't1', amount: '50000', method: 'bank_transfer' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid method', () => {
    const result = createPaymentSchema.safeParse({ tenant_id: 't1', amount: '50000', method: 'bitcoin' });
    expect(result.success).toBe(false);
  });
});

describe('updateProfileSchema', () => {
  it('accepts valid input', () => {
    const result = updateProfileSchema.safeParse({ firstName: 'John', lastName: 'Doe', email: 'john@test.com' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = updateProfileSchema.safeParse({ firstName: 'John', lastName: 'Doe', email: 'bad' });
    expect(result.success).toBe(false);
  });
});

describe('updateCompanyInfoSchema', () => {
  it('accepts empty optional fields', () => {
    const result = updateCompanyInfoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid website', () => {
    const result = updateCompanyInfoSchema.safeParse({ companyWebsite: 'https://example.com' });
    expect(result.success).toBe(true);
  });

  it('accepts empty website', () => {
    const result = updateCompanyInfoSchema.safeParse({ companyWebsite: '' });
    expect(result.success).toBe(true);
  });
});

describe('updateBankDetailsSchema', () => {
  it('accepts all optional fields', () => {
    const result = updateBankDetailsSchema.safeParse({ bankName: 'NCB', bankBranch: 'Half Way Tree' });
    expect(result.success).toBe(true);
  });
});

describe('createPropertySchema', () => {
  it('accepts valid input', () => {
    const result = createPropertySchema.safeParse({ name: 'Sunset Apartments' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createPropertySchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

describe('createUnitSchema', () => {
  it('accepts valid input', () => {
    const result = createUnitSchema.safeParse({ name: 'A1', rentAmount: '50000' });
    expect(result.success).toBe(true);
  });

  it('rejects non-positive rent', () => {
    const result = createUnitSchema.safeParse({ name: 'A1', rentAmount: '-1' });
    expect(result.success).toBe(false);
  });
});
