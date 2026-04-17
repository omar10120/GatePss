/**
 * Sohar Port API Integration - HTTP Client
 * 
 * This file contains the HTTP client for making requests to the Sohar Port API.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
    SoharPortConfig,
    RequestOptions,
    SoharPortError,
    SoharPortNetworkError,
    SoharPortAuthError,
    SoharPortValidationError,
    SoharPortNotFoundError,
} from './types';
import { getConfig, HTTP_STATUS, ERROR_MESSAGES } from './config';
import { logApiCall } from './utils/logger';
import { logger } from '../logger';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { randomUUID } from 'crypto';

/**
 * HTTP Client for Sohar Port API
 */
export class SoharPortHttpClient {
    private axiosInstance: AxiosInstance;
    private config: Required<SoharPortConfig>;

    constructor(config?: Partial<SoharPortConfig>) {
        this.config = getConfig(config);
        this.axiosInstance = this.createAxiosInstance();
    }

    /** When true, createGatePass sends multipart to the gate pass proxy for assembly into Sohar JSON */
    usesGatepassMultipart(): boolean {
        return this.config.gatepassMultipart === true;
    }

    /**
     * Create configured Axios instance
     */
    private createAxiosInstance(): AxiosInstance {
        if (this.config.useMock) {
            console.log('?? Sohar Port API is in MOCK mode');
        }

        const axiosConfig: AxiosRequestConfig = {
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        };

        // Add Proxy Support
        if (this.config.proxyUrl) {
            console.log(`?? Routing Sohar Port API through proxy: ${this.config.proxyUrl}`);
            const agent = new HttpsProxyAgent(this.config.proxyUrl);
            axiosConfig.httpsAgent = agent;
            axiosConfig.proxy = false; // Disable default axios proxy handling to use the agent
        }

        const instance = axios.create(axiosConfig);

        // Request interceptor
        instance.interceptors.request.use(
            (config) => {
                const requestId = randomUUID();
                (config as any).requestId = requestId;
                (config as any).startTime = Date.now();

                // Add Basic Auth credentials
                if (this.config.username && this.config.password) {
                    const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
                    config.headers.Authorization = `Basic ${credentials}`;
                } else if (this.config.apiKey) {
                    // Fallback to Bearer token if Basic Auth not provided
                    config.headers.Authorization = `Bearer ${this.config.apiKey}`;
                }

                // Structured log for request
                const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
                const logData =
                    config.data instanceof FormData
                        ? { type: 'multipart/form-data', fields: [...config.data.keys()] }
                        : config.data;
                logger.info(`📤 Sohar Port API Request: ${config.method?.toUpperCase()} ${fullUrl}`, {
                    type: 'SOHAR_PORT_REQUEST',
                    requestId,
                    method: config.method?.toUpperCase(),
                    url: fullUrl,
                    params: config.params,
                    headers: { ...config.headers, Authorization: '***MASKED***' },
                    data: logData,
                });

                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor
        instance.interceptors.response.use(
            (response) => {
                const requestId = (response.config as any).requestId;
                const duration = Date.now() - (response.config as any).startTime;

                // Structured log for successful response
                logger.info(`✅ Sohar Port API Response: ${response.status} ${response.config.url}`, {
                    type: 'SOHAR_PORT_RESPONSE',
                    requestId,
                    url: response.config.url,
                    status: response.status,
                    duration: `${duration}ms`,
                    data: response.data,
                });
                return response;
            },
            (error) => {
                const requestId = error.config?.requestId;
                const duration = error.config?.startTime ? Date.now() - error.config.startTime : undefined;

                // Structured log for error response
                const fullUrl = error.config?.baseURL ? `${error.config.baseURL}${error.config.url}` : error.config?.url;
                logger.error(`❌ Sohar Port API Error: ${error.message} ${fullUrl}`, {
                    type: 'SOHAR_PORT_ERROR',
                    requestId,
                    url: fullUrl,
                    params: error.config?.params,
                    status: error.response?.status,
                    message: error.message,
                    duration: duration ? `${duration}ms` : undefined,
                    data: error.response?.data,
                    stack: error.stack,
                });
                return Promise.reject(this.handleError(error));
            }
        );

        return instance;
    }

    /**
     * Make HTTP request
     */
    async request<T = any>(options: RequestOptions): Promise<T> {
        const startTime = Date.now();

        try {
            const axiosConfig: AxiosRequestConfig = {
                method: options.method,
                url: options.endpoint,
                data: options.data,
                params: options.params,
                headers: { ...options.headers },
            };

            if (options.multipart) {
                // Let axios set multipart boundary (do not send default JSON Content-Type)
                (axiosConfig.headers as Record<string, unknown>)['Content-Type'] = false;
            }

            const response: AxiosResponse<T> = await this.axiosInstance.request(axiosConfig);

            const duration = Date.now() - startTime;

            // Log successful API call
            await logApiCall({
                operation: `${options.method} ${options.endpoint}`,
                statusCode: response.status,
                duration,
                externalReference: options.externalReference,
                requestData: options.multipart ? { multipart: true, endpoint: options.endpoint } : options.data,
                responseData: response.data,
            });

            return response.data;

        } catch (error: any) {
            const duration = Date.now() - startTime;

            // Log failed API call
            await logApiCall({
                operation: `${options.method} ${options.endpoint}`,
                statusCode: error.response?.status || 0,
                duration,
                externalReference: options.externalReference,
                error: error.message,
                requestData: options.multipart ? { multipart: true, endpoint: options.endpoint } : options.data,
            });

            throw error;
        }
    }

    /**
     * Handle and transform errors
     */
    private handleError(error: any): SoharPortError {
        // Network errors (timeout, connection refused, etc.)
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            return new SoharPortNetworkError(ERROR_MESSAGES.TIMEOUT_ERROR, {
                code: error.code,
                originalError: error.message,
            });
        }

        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return new SoharPortNetworkError(ERROR_MESSAGES.NETWORK_ERROR, {
                code: error.code,
                originalError: error.message,
            });
        }

        // HTTP errors
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            switch (status) {
                case HTTP_STATUS.UNAUTHORIZED:
                case HTTP_STATUS.FORBIDDEN:
                    return new SoharPortAuthError(
                        data?.message || ERROR_MESSAGES.AUTH_ERROR,
                        status,
                        data
                    );

                case HTTP_STATUS.BAD_REQUEST:
                    return new SoharPortValidationError(
                        data?.ErrorDetails || data?.message || data?.Message || ERROR_MESSAGES.VALIDATION_ERROR,
                        data
                    );

                case HTTP_STATUS.NOT_FOUND:
                    return new SoharPortNotFoundError(
                        data?.ErrorDetails || data?.message || data?.Message || ERROR_MESSAGES.NOT_FOUND,
                        data
                    );

                default:
                    return new SoharPortError(
                        data?.ErrorDetails || data?.message || data?.Message || ERROR_MESSAGES.UNKNOWN_ERROR,
                        status,
                        data?.errorCode,
                        data
                    );
            }
        }

        // Unknown errors
        return new SoharPortError(
            error.message || ERROR_MESSAGES.UNKNOWN_ERROR,
            0,
            'UNKNOWN_ERROR',
            error
        );
    }

    /**
     * Retry logic for failed requests
     */
    async requestWithRetry<T = any>(
        options: RequestOptions,
        attempts: number = this.config.retryAttempts
    ): Promise<T> {
        let lastError: any;

        for (let i = 0; i < attempts; i++) {
            try {
                return await this.request<T>(options);
            } catch (error) {
                lastError = error;

                // Don't retry on validation or auth errors
                if (
                    error instanceof SoharPortValidationError ||
                    error instanceof SoharPortAuthError ||
                    error instanceof SoharPortNotFoundError
                ) {
                    throw error;
                }

                // Wait before retrying (exponential backoff)
                if (i < attempts - 1) {
                    const delay = this.config.retryDelay * Math.pow(2, i);
                    console.log(`⏳ Retrying in ${delay}ms... (Attempt ${i + 2}/${attempts})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }
}
