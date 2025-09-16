import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Supabase auth endpoints
  http.post('*/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      },
    });
  }),

  // Mock Supabase database endpoints
  http.get('*/rest/v1/*', () => {
    return HttpResponse.json([]);
  }),

  http.post('*/rest/v1/*', () => {
    return HttpResponse.json({ id: 1, created_at: new Date().toISOString() });
  }),

  http.patch('*/rest/v1/*', () => {
    return HttpResponse.json({ id: 1, updated_at: new Date().toISOString() });
  }),

  http.delete('*/rest/v1/*', () => {
    return HttpResponse.json({});
  }),

  // Mock PayPal endpoints
  http.post('*/functions/v1/create-paypal-order', () => {
    return HttpResponse.json({ orderID: 'mock-paypal-order-id' });
  }),

  http.post('*/functions/v1/capture-paypal-order', () => {
    return HttpResponse.json({ 
      success: true, 
      paymentId: 'mock-payment-id',
      status: 'COMPLETED'
    });
  }),

  // Mock other API endpoints as needed
  http.get('*/api/test', () => {
    return HttpResponse.json({ message: 'Test API response' });
  }),
];