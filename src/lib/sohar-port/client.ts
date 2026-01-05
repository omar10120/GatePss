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

    /**
     * Create configured Axios instance
     */
    private createAxiosInstance(): AxiosInstance {
        const instance = axios.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Version': this.config.version,
            },
        });

        // Request interceptor
        instance.interceptors.request.use(
            (config) => {
                // Add API key to headers
                if (this.config.apiKey) {
                    config.headers.Authorization = `Bearer ${this.config.apiKey}`;
                }

                // Log request
                console.log(`📤 Sohar Port API Request: ${config.method?.toUpperCase()} ${config.url}`);

                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor
        instance.interceptors.response.use(
            (response) => {
                // Log successful response
                console.log(`✅ Sohar Port API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                // Log error response
                console.error(`❌ Sohar Port API Error: ${error.message}`);
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
                headers: options.headers,
            };

            const response: AxiosResponse<T> = await this.axiosInstance.request(axiosConfig);

            const duration = Date.now() - startTime;

            // Log successful API call
            await logApiCall({
                operation: `${options.method} ${options.endpoint}`,
                statusCode: response.status,
                duration,
                requestData: options.data,
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
                error: error.message,
                requestData: options.data,
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
                        data?.message || ERROR_MESSAGES.VALIDATION_ERROR,
                        data
                    );

                case HTTP_STATUS.NOT_FOUND:
                    return new SoharPortNotFoundError(
                        data?.message || ERROR_MESSAGES.NOT_FOUND,
                        data
                    );

                default:
                    return new SoharPortError(
                        data?.message || ERROR_MESSAGES.UNKNOWN_ERROR,
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
