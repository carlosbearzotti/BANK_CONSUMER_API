import { describe, it } from 'node:test';
import assert from 'node:assert';
import { loanService } from './loanService.js';

describe('Loan Service', () => {
  it('should call simulate endpoint with customer data', async () => {
    let calledUrl = '';
    let calledBody = '';

    globalThis.fetch = async (url, options) => {
      calledUrl = url;
      calledBody = options.body;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ customer: 'Carlos', loans: [{ type: 'PERSONAL', interestRate: 4.0 }] })
      };
    };

    const customerData = { name: 'Carlos', cpf: '12345678900', age: 30, income: 6000, location: 'SP' };
    const res = await loanService.simulate(customerData);

    assert.strictEqual(calledUrl, 'http://localhost:8080/customer-loans');
    assert.strictEqual(calledBody, JSON.stringify(customerData));
    assert.strictEqual(res.customer, 'Carlos');
    assert.strictEqual(res.loans.length, 1);
  });

  it('should fetch pre-approved loans for authenticated user', async () => {
    let calledUrl = '';

    globalThis.fetch = async (url) => {
      calledUrl = url;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ customer: 'Carlos', loans: [{ type: 'PERSONAL', interestRate: 4.0 }, { type: 'GUARANTEED', interestRate: 3.0 }] })
      };
    };

    const res = await loanService.getMyPreApprovedLoans('SP');
    assert.strictEqual(calledUrl, 'http://localhost:8080/api/loans/me?location=SP');
    assert.strictEqual(res.loans.length, 2);
  });
});
