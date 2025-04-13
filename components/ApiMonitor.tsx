// components/ApiMonitor.tsx
// A component that displays real-time API call information for debugging

import React, { useState, useEffect, useRef } from 'react';
import { apiDebug } from '../api';

// Type definitions
interface ApiCallError {
    message: string;
    status?: number;
    data?: any;
}

interface ApiCall {
    id: number;
    method: string;
    url: string;
    data?: any;
    timestamp: string;
    status: 'pending' | 'success' | 'error';
    statusCode?: number;
    responseData?: any;
    responseTimestamp?: string;
    duration?: number | null;
    error?: ApiCallError;
}

interface ApiRequestEvent {
    method: string;
    url: string;
    data?: any;
    timestamp: string;
}

interface ApiResponseEvent extends ApiRequestEvent {
    status: number;
    data: any;
    duration?: number | null;
}

interface ApiErrorEvent extends ApiRequestEvent {
    error: ApiCallError;
    duration?: number | null;
}

export function ApiMonitor(): React.ReactElement | null {
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'success' | 'error'>('all');
    const maxCalls = 100; // Maximum number of calls to store
    const scrollRef = useRef<HTMLDivElement | null>(null);

    // Custom event listener for API calls
    useEffect(() => {
        if (!apiDebug.isDebugEnabled()) return;

        // Create custom event listeners for API calls
        const handleApiRequest = (e: CustomEvent<ApiRequestEvent>) => {
            const { method, url, data, timestamp } = e.detail;
            // @ts-ignore
            setApiCalls(prev => {
                const newCalls = [
                    {
                        id: Date.now(),
                        method,
                        url,
                        data,
                        timestamp,
                        status: 'pending',
                        duration: null
                    },
                    ...prev
                ].slice(0, maxCalls);
                return newCalls;
            });
        };

        const handleApiResponse = (e: CustomEvent<ApiResponseEvent>) => {
            const { method, url, status, data, timestamp, duration } = e.detail;
            setApiCalls(prev => {
                return prev.map(call => {
                    // Match the pending request with this response
                    if (call.method === method && call.url === url && call.status === 'pending') {
                        return {
                            ...call,
                            status: status >= 200 && status < 300 ? 'success' : 'error',
                            statusCode: status,
                            responseData: data,
                            responseTimestamp: timestamp,
                            duration
                        };
                    }
                    return call;
                });
            });
        };

        const handleApiError = (e: CustomEvent<ApiErrorEvent>) => {
            const { method, url, error, timestamp, duration } = e.detail;
            setApiCalls(prev => {
                return prev.map(call => {
                    // Match the pending request with this error
                    if (call.method === method && call.url === url && call.status === 'pending') {
                        return {
                            ...call,
                            status: 'error',
                            error,
                            responseTimestamp: timestamp,
                            duration
                        };
                    }
                    return call;
                });
            });
        };

        // Register event listeners
        window.addEventListener('api-request', handleApiRequest as EventListener);
        window.addEventListener('api-response', handleApiResponse as EventListener);
        window.addEventListener('api-error', handleApiError as EventListener);

        // Clean up
        return () => {
            window.removeEventListener('api-request', handleApiRequest as EventListener);
            window.removeEventListener('api-response', handleApiResponse as EventListener);
            window.removeEventListener('api-error', handleApiError as EventListener);
        };
    }, []);

    // Auto-scroll to bottom when new calls are added
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [apiCalls]);

    // Filter API calls
    const filteredCalls = apiCalls.filter(call => {
        if (filter === 'all') return true;
        return call.status === filter;
    });

    // Don't render if debugging is disabled
    if (!apiDebug.isDebugEnabled()) {
        return null;
    }

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsVisible(!isVisible)}
                className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-2 rounded-full shadow-lg"
                title="API Monitor"
            >
                {isVisible ? 'X' : '📊'}
            </button>

            {/* Monitor Panel */}
            {isVisible && (
                <div className="fixed bottom-16 right-4 z-50 bg-gray-800 text-white rounded shadow-lg w-full max-w-4xl h-2/3 flex flex-col">
                    {/* Header */}
                    <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold">API Monitor</h3>
                        <div className="flex items-center space-x-2">
                            <div className="flex rounded overflow-hidden text-sm">
                                <button
                                    className={`px-3 py-1 ${filter === 'all' ? 'bg-blue-600' : 'bg-gray-700'}`}
                                    onClick={() => setFilter('all')}
                                >
                                    All
                                </button>
                                <button
                                    className={`px-3 py-1 ${filter === 'pending' ? 'bg-yellow-600' : 'bg-gray-700'}`}
                                    onClick={() => setFilter('pending')}
                                >
                                    Pending
                                </button>
                                <button
                                    className={`px-3 py-1 ${filter === 'success' ? 'bg-green-600' : 'bg-gray-700'}`}
                                    onClick={() => setFilter('success')}
                                >
                                    Success
                                </button>
                                <button
                                    className={`px-3 py-1 ${filter === 'error' ? 'bg-red-600' : 'bg-gray-700'}`}
                                    onClick={() => setFilter('error')}
                                >
                                    Error
                                </button>
                            </div>
                            <button
                                onClick={() => setApiCalls([])}
                                className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs"
                            >
                                Close
                            </button>
                        </div>
                    </div>

                    {/* API Calls List */}
                    <div className="flex-1 overflow-y-auto p-2" ref={scrollRef}>
                        {filteredCalls.length === 0 ? (
                            <div className="text-center text-gray-500 p-4">
                                No API calls recorded yet
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredCalls.map(call => (
                                    <div
                                        key={call.id}
                                        className={`p-3 rounded text-sm ${
                                            call.status === 'pending'
                                                ? 'bg-gray-700'
                                                : call.status === 'success'
                                                    ? 'bg-gray-700 border-l-4 border-green-500'
                                                    : 'bg-gray-700 border-l-4 border-red-500'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center">
                        <span className={`px-2 py-0.5 rounded text-xs mr-2 ${
                            call.method === 'get'
                                ? 'bg-blue-600'
                                : call.method === 'post'
                                    ? 'bg-green-600'
                                    : call.method === 'delete'
                                        ? 'bg-red-600'
                                        : 'bg-purple-600'
                        }`}>
                          {call.method.toUpperCase()}
                        </span>
                                                <span className="font-mono">{call.url}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {call.status !== 'pending' && (
                                                    <span className="text-xs">
                            {call.duration ? `${call.duration}ms` : ''}
                          </span>
                                                )}
                                                {call.status === 'pending' ? (
                                                    <span className="flex h-3 w-3">
                            <span className="animate-ping absolute h-3 w-3 rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative rounded-full h-3 w-3 bg-yellow-500"></span>
                          </span>
                                                ) : call.status === 'success' ? (
                                                    <span className="text-green-500">✓</span>
                                                ) : (
                                                    <span className="text-red-500">✗</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Request Data */}
                                        {call.data && (
                                            <details className="mt-1">
                                                <summary className="cursor-pointer text-xs text-gray-400">Request Data</summary>
                                                <pre className="bg-gray-900 p-2 rounded mt-1 overflow-x-auto text-xs">
                          {typeof call.data === 'object'
                              ? JSON.stringify(call.data, null, 2)
                              : String(call.data)}
                        </pre>
                                            </details>
                                        )}

                                        {/* Response Data */}
                                        {call.responseData && (
                                            <details className="mt-1">
                                                <summary className="cursor-pointer text-xs text-gray-400">
                                                    Response: {call.statusCode} {call.duration ? `(${call.duration}ms)` : ''}
                                                </summary>
                                                <pre className="bg-gray-900 p-2 rounded mt-1 overflow-x-auto text-xs">
                          {typeof call.responseData === 'object'
                              ? JSON.stringify(call.responseData, null, 2)
                              : String(call.responseData)}
                        </pre>
                                            </details>
                                        )}

                                        {/* Error Message */}
                                        {call.error && (
                                            <details className="mt-1">
                                                <summary className="cursor-pointer text-xs text-red-400">Error Details</summary>
                                                <pre className="bg-gray-900 p-2 rounded mt-1 overflow-x-auto text-xs text-red-300">
                          {typeof call.error === 'object'
                              ? JSON.stringify(call.error, null, 2)
                              : String(call.error)}
                        </pre>
                                            </details>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

// To use this component, add it to your _app.tsx file
// import { ApiMonitor } from '../components/ApiMonitor';
// ...
// return (
//   <>
//     <Component {...pageProps} />
//     {process.env.NODE_ENV === 'development' && <ApiMonitor />}
//   </>
// );

export default ApiMonitor;
