import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class NombaService {
  private readonly logger = new Logger(NombaService.name);
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get baseUrl(): string {
    return (
      this.configService.get<string>('NOMBA_BASE_URL') ||
      'https://api.nomba.com/v1'
    );
  }

  private get accountId(): string {
    return this.configService.get<string>('NOMBA_ACCOUNT_ID')!;
  }

  private get clientId(): string {
    return this.configService.get<string>('NOMBA_CLIENT_ID')!;
  }

  private get clientSecret(): string {
    return this.configService.get<string>('NOMBA_CLIENT_SECRET')!;
  }

  async getAccessToken(): Promise<string> {
    // Return cached token if still valid

    // Check if token is still valid (with 5-minute buffer)
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutes in ms

    if (
      this.accessToken &&
      this.tokenExpiry &&
      this.tokenExpiry.getTime() > now.getTime() + bufferTime
    ) {
      return this.accessToken;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/auth/token/issue`,
          {
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              accountId: this.accountId,
            },
          },
        ),
      );

      const { data } = response.data; // As per their example

      this.accessToken = data.access_token;
      //  token expiry is 1h
      this.tokenExpiry = new Date(
        Date.now() + (data.expires_in || 3600) * 1000,
      );

      //   this.logger.log('Nomba access token refreshed successfully');
      this.logger.log(
        `New Nomba token issued. Expires in ${data.expires_in} seconds.`,
      );
      return this.accessToken || '';
    } catch (error) {
      this.logger.error('Failed to get Nomba access token', error);
      if (error instanceof AxiosError) {
        throw new HttpException(
          `Nomba Auth Error: ${(error.response?.data as any)?.message || error.message}`,
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw error;
    }
  }

  // Reusable method for any Nomba API call

  // ==================== Convenience Methods ====================

  async get<T>(endpoint: string, params?: any): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, params);
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>('POST', endpoint, body);
  }

  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>('PUT', endpoint, body);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }

  // Internal request handler
  private async request<T>(
    method: string,
    endpoint: string,
    body?: any,
    params?: any,
  ): Promise<T> {
    const token = await this.getAccessToken();

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            accountId: this.accountId,
          },
          data: body,
          params,
        }),
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Nomba ${method} ${endpoint} failed`,
        axiosError.response?.data,
      );

      throw new HttpException(
        (axiosError.response?.data as any)?.message ||
          `Nomba API error: ${method} ${endpoint}`,
        axiosError.response?.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
  
  async makeRequest<T>(
    endpoint: string,
    method: string = 'GET',
    payload?: any,
  ): Promise<T> {
    const token = await this.getAccessToken();

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: `${this.baseUrl}${endpoint}`,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            accountId: this.accountId,
          },
          data: payload,
        }),
      );

      return response.data;
    } catch (error: unknown) {
      this.logger.error(`Nomba API Error on ${endpoint}`, error);

      if (error instanceof AxiosError) {
        throw new HttpException(
          `Nomba API Error: ${(error.response?.data as any)?.message || error.message}`,
          error.response?.status || HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        `Nomba API Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
