import axios from 'axios';
import { logger } from '../../utils/logger.js';
import { Integration } from '../../models/Integration.js';
import { redisClient } from '../../config/redis.js';

export class TokenManager {
  private accountId: number;
  private accessToken: string;
  private refreshToken: string;
  private tokenExpiry: number;
  private refreshPromise: Promise<string> | null = null;

  constructor(
    accountId: number,
    accessToken: string,
    refreshToken: string,
    tokenExpiry: number
  ) {
    this.accountId = accountId;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = tokenExpiry;
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidToken(): Promise<string> {
    // Check if token is still valid (with 5 minute buffer)
    const now = Math.floor(Date.now() / 1000);
    const buffer = 5 * 60; // 5 minutes

    if (this.tokenExpiry > now + buffer) {
      return this.accessToken;
    }

    // Token needs refresh
    return this.refreshAccessToken();
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.doRefresh();

    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Actual refresh logic
   */
  private async doRefresh(): Promise<string> {
    logger.info(`Refreshing AMO token for account ${this.accountId}`);

    try {
      // Get integration from DB
      const integration = await Integration.findOne({
        where: { amocrm_account_id: this.accountId }
      });

      if (!integration) {
        throw new Error(`Integration not found for account ${this.accountId}`);
      }

      // Prepare refresh request
      const response = await axios.post(
        `${integration.base_url}/oauth2/access_token`,
        {
          client_id: integration.client_id || process.env.AMO_CLIENT_ID,
          client_secret: process.env.AMO_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          redirect_uri: process.env.AMO_REDIRECT_URI
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;

      // Update tokens
      this.accessToken = access_token;
      this.refreshToken = refresh_token;
      this.tokenExpiry = Math.floor(Date.now() / 1000) + expires_in;

      // Save to database
      await integration.update({
        access_token,
        refresh_token,
        token_expiry: this.tokenExpiry,
        last_sync_at: new Date()
      });

      // Cache in Redis
      await this.cacheTokens();

      logger.info(`Token refreshed successfully for account ${this.accountId}`);
      return this.accessToken;

    } catch (error: any) {
      logger.error(`Failed to refresh token for account ${this.accountId}:`, error);

      // If refresh fails, try to get subdomain and retry
      if (error.response?.status === 401 || error.response?.status === 404) {
        return this.handleSubdomainChange();
      }

      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Handle subdomain change
   */
  private async handleSubdomainChange(): Promise<string> {
    logger.info(`Handling possible subdomain change for account ${this.accountId}`);

    try {
      // Extract API domain from access token (JWT decode)
      const tokenParts = this.accessToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid JWT token format');
      }

      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      const apiDomain = payload.api_domain || 'api-a.amocrm.ru';

      // Get current subdomain
      const response = await axios.get(
        `https://${apiDomain}/oauth2/account/current/subdomain`,
        {
          headers: {
            'X-Refresh-Token': this.refreshToken
          }
        }
      );

      const { domain } = response.data;
      const newBaseUrl = `https://${domain}`;

      logger.info(`New subdomain detected: ${domain}`);

      // Update integration with new domain
      const integration = await Integration.findOne({
        where: { amocrm_account_id: this.accountId }
      });

      if (integration) {
        await integration.update({
          base_url: newBaseUrl,
          domain: domain
        });

        // Retry token refresh with new domain
        return this.doRefresh();
      }

      throw new Error('Integration not found after subdomain change');

    } catch (error: any) {
      logger.error(`Failed to handle subdomain change:`, error);
      throw error;
    }
  }

  /**
   * Force refresh (for error recovery)
   */
  async forceRefresh(): Promise<string> {
    this.tokenExpiry = 0; // Force expiry
    return this.refreshAccessToken();
  }

  /**
   * Cache tokens in Redis
   */
  private async cacheTokens(): Promise<void> {
    const cacheKey = `amo:tokens:${this.accountId}`;
    const data = {
      access_token: this.accessToken,
      refresh_token: this.refreshToken,
      token_expiry: this.tokenExpiry
    };

    await redisClient.setex(
      cacheKey,
      3600, // 1 hour TTL
      JSON.stringify(data)
    );
  }

  /**
   * Load tokens from cache
   */
  static async fromCache(accountId: number): Promise<TokenManager | null> {
    const cacheKey = `amo:tokens:${accountId}`;
    const cached = await redisClient.get(cacheKey);

    if (!cached) {
      return null;
    }

    try {
      const data = JSON.parse(cached);
      return new TokenManager(
        accountId,
        data.access_token,
        data.refresh_token,
        data.token_expiry
      );
    } catch (error) {
      logger.error('Failed to parse cached tokens:', error);
      return null;
    }
  }
}