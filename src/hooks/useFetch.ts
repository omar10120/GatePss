import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';

interface UseFetchOptions {
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
    dependencies?: any[];
}

export const useFetch = <T = any>(
    url: string | null,
    options: UseFetchOptions = {}
) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const { onSuccess, onError, dependencies = [] } = options;

    useEffect(() => {
        if (!url) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await apiFetch(url);
                setData(result);

                if (onSuccess) {
                    onSuccess(result);
                }
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Unknown error');
                setError(error);

                if (onError) {
                    onError(error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [url, ...dependencies]);

    const refetch = async () => {
        if (!url) return;

        setLoading(true);
        setError(null);

        try {
            const result = await apiFetch(url);
            setData(result);

            if (onSuccess) {
                onSuccess(result);
            }
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            setError(error);

            if (onError) {
                onError(error);
            }
        } finally {
            setLoading(false);
        }
    };

    return {
        data,
        loading,
        error,
        refetch,
    };
};
