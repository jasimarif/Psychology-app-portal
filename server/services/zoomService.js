class ZoomService {
  constructor() {
    this.baseURL = 'https://api.zoom.us/v2';
    this.accessToken = null;
    this.tokenExpiry = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      const accountId = process.env.ZOOM_ACCOUNT_ID;
      const clientId = process.env.ZOOM_CLIENT_ID;
      const clientSecret = process.env.ZOOM_CLIENT_SECRET;

      if (!accountId || !clientId || !clientSecret) {
        console.warn('Zoom Service: Missing Zoom credentials. Video integration disabled.');
        return false;
      }

      await this.getAccessToken();
      this.initialized = true;
      console.log('Zoom Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Zoom Service:', error.message);
      return false;
    }
  }

  async getAccessToken() {
    try {
      const accountId = process.env.ZOOM_ACCOUNT_ID;
      const clientId = process.env.ZOOM_CLIENT_ID;
      const clientSecret = process.env.ZOOM_CLIENT_SECRET;

      const response = await fetch(
        `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('Error getting Zoom access token:', error.message);
      throw new Error('Failed to authenticate with Zoom');
    }
  }

  async ensureValidToken() {
    if (!this.accessToken || Date.now() >= this.tokenExpiry - 60000) {
      await this.getAccessToken();
    }
  }

  async deleteMeeting(meetingId) {
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) {
        throw new Error('Zoom Service is not initialized. Check Zoom credentials.');
      }
    }

    try {
      await this.ensureValidToken();

      const response = await fetch(
        `${this.baseURL}/meetings/${meetingId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      // If meeting not found (404), consider it already deleted
      if (response.status === 404) {
        console.log(`Zoom meeting ${meetingId} not found (may already be deleted)`);
        return true;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to delete Zoom meeting: ${errorData.message || response.statusText}`);
      }

      console.log(`Zoom meeting ${meetingId} deleted successfully`);
      return true;
    } catch (error) {
      console.error('Error deleting Zoom meeting:', error.message);
      throw error;
    }
  }

  async isAvailable() {
    if (this.initialized) return true;
    return await this.initialize();
  }
}

const zoomService = new ZoomService();
export default zoomService;
