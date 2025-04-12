// config/api-config.ts
// Configuration for enabling API debugging

/**
 * This file contains configuration for API debugging.
 *
 * To enable debugging:
 * 1. Create a .env.local file in your Next.js project root
 * 2. Add NEXT_PUBLIC_API_DEBUG=true to enable debugging
 * 3. Or add NEXT_PUBLIC_API_DEBUG=false to disable debugging
 */

// Create a simple debugging toggle component
import React from 'react';
import { apiDebug } from '../api';

export function ApiDebugToggle(): React.ReactElement {
    const isEnabled = apiDebug.isDebugEnabled();

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white p-2 rounded shadow-lg opacity-75 hover:opacity-100 transition-opacity">
        <div className="flex items-center space-x-2">
        <label className="flex items-center cursor-pointer">
        <input
            type="checkbox"
    checked={isEnabled}
    onChange={() => apiDebug.setDebug(!isEnabled)}
    className="mr-2"
        />
        <span>API Debug {isEnabled ? 'ON' : 'OFF'}</span>
    </label>
    <button
    onClick={() => apiDebug.clearLogs()}
    className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs"
        >
        Clear Logs
    </button>
    </div>
    </div>
);
}

// Utility function to log API response times to console
interface PerformanceEntry {
    name: string;
    startTime: number;
    duration: number;
    responseStart: number;
    responseEnd: number;
}

export function logResponseTimes(apiCalls?: any[]): void {
    if (!apiDebug.isDebugEnabled()) return;

    const performanceEntries = window.performance.getEntriesByType('resource') as PerformanceEntry[];

    const apiEndpoints = performanceEntries.filter(entry =>
        entry.name.includes(process.env.NEXT_PUBLIC_API_URL || '')
    );

    console.group('📊 API Performance Metrics');

    if (apiEndpoints.length === 0) {
        console.log('No API calls measured yet');
    } else {
        apiEndpoints.forEach(entry => {
            const url = new URL(entry.name);
            console.log(
                `${url.pathname}:`,
                `Total: ${Math.round(entry.duration)}ms`,
                `| TTFB: ${Math.round(entry.responseStart - entry.startTime)}ms`,
                `| Download: ${Math.round(entry.responseEnd - entry.responseStart)}ms`
            );
        });
    }

    console.groupEnd();
}

// Export configuration
export interface ApiConfig {
    baseUrl: string;
    debug: boolean;
}

export const apiConfig: ApiConfig = {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    debug: process.env.NEXT_PUBLIC_API_DEBUG === 'true',
};

export default apiConfig;
