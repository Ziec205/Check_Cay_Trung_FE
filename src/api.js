const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

async function request(path, options = {}, timeoutMs = 30000) {
  let res;
  try {
    res = await fetch(BASE + path, {
      ...options,
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    throw new Error('Không kết nối được máy chủ. Máy chủ miễn phí có thể đang khởi động, hãy thử lại sau ít giây.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
  return data;
}

const send = (method, body) => ({ method, body: JSON.stringify(body) });

export const api = {
  months: () => request('/api/months'),
  slips: (month) => request(`/api/slips?month=${month}`),
  createSlip: (slip) => request('/api/slips', send('POST', slip)),
  updateSlip: (id, slip) => request(`/api/slips/${id}`, send('PUT', slip)),
  deleteSlip: (id) => request(`/api/slips/${id}`, { method: 'DELETE' }),
  deleteMonth: (month) => request(`/api/months/${month}`, { method: 'DELETE' }),
  ocr: (image, mimeType) => request('/api/ocr', send('POST', { image, mimeType }), 90000),
  invoiceMonths: () => request('/api/invoices/months'),
  eggTypes: () => request('/api/invoices/egg-types'),
  invoices: (month) => request(`/api/invoices?month=${month}`),
  createInvoice: (inv) => request('/api/invoices', send('POST', inv)),
  updateInvoice: (id, inv) => request(`/api/invoices/${id}`, send('PUT', inv)),
  deleteInvoice: (id) => request(`/api/invoices/${id}`, { method: 'DELETE' }),
  exportUrl: (month) => `${BASE}/api/export${month ? `?month=${month}` : ''}`,
};
