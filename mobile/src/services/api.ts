// ==============================================================================
// ASSETCARE MOBILE - API CLIENT & BACKEND INTEGRATION
// ==============================================================================

export const API_BASE_URL = 'http://localhost:3000/api'; // Or your machine's LAN IP e.g. http://192.168.1.X:3000/api

export class AssetCareApi {
  private static token: string | null = null;

  static setAuthToken(token: string) {
    this.token = token;
  }

  private static getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Auth
  static async login(username: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.token) {
      this.setAuthToken(data.token);
    }
    return data;
  }

  // Assets
  static async getAssets(search?: string) {
    const url = search ? `${API_BASE_URL}/assets?search=${encodeURIComponent(search)}` : `${API_BASE_URL}/assets`;
    const res = await fetch(url, { headers: this.getHeaders() });
    return res.json();
  }

  static async getAssetDetails(id: string) {
    const res = await fetch(`${API_BASE_URL}/assets/${id}`, { headers: this.getHeaders() });
    return res.json();
  }

  // Upload Invoice from Camera or Gallery
  static async uploadBill(uri: string, assetId?: string, documentType: string = 'repair_invoice') {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'invoice.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri,
      name: filename,
      type,
    } as any);

    if (assetId) formData.append('asset_id', assetId);
    formData.append('document_type', documentType);
    formData.append('auto_ocr', 'true');

    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(`${API_BASE_URL}/bills/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return res.json();
  }

  // Reminders
  static async getReminders() {
    const res = await fetch(`${API_BASE_URL}/reminders`, { headers: this.getHeaders() });
    return res.json();
  }

  static async markReminderComplete(id: string) {
    const res = await fetch(`${API_BASE_URL}/reminders/${id}/complete`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ completedDate: new Date().toISOString().split('T')[0] }),
    });
    return res.json();
  }

  // Warranties
  static async getWarranties() {
    const res = await fetch(`${API_BASE_URL}/warranties`, { headers: this.getHeaders() });
    return res.json();
  }
}
