import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const DEBUG = process.env.NEXT_PUBLIC_API_DEBUG === 'true';

// Custom axios config with metadata
interface AxiosRequestConfigWithMetadata extends AxiosRequestConfig {
    metadata?: {
        startTime: number;
    };
}

// Event detail types
interface ApiRequestEventDetail {
    method: string;
    url: string;
    data?: any;
    timestamp: string;
}

interface ApiResponseEventDetail extends ApiRequestEventDetail {
    status: number;
    data: any;
    duration: number | null;
}

interface ApiErrorEventDetail extends ApiRequestEventDetail {
    error: {
        message: string;
        status?: number;
        data?: any;
    };
    duration: number | null;
}

// Event dispatcher
const dispatchApiEvent = <T extends ApiRequestEventDetail | ApiResponseEventDetail | ApiErrorEventDetail>(
    eventName: string,
    detail: T
): void => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
};

// Logger function to handle debugging
const logger = {
    request: (method: string, endpoint: string, data?: any): void => {
    if (DEBUG) {
        console.group(`🔷 API Request: ${method.toUpperCase()} ${endpoint}`);
        console.log('Timestamp:', new Date().toISOString());
        if (data) {
            console.log('Request Data:', data);
        }
        console.groupEnd();
    }
},

success: (method: string, endpoint: string, response: AxiosResponse, startTime?: number): void => {
    if (DEBUG) {
        const duration = startTime ? `(${Date.now() - startTime}ms)` : '';
        console.group(`✅ API Response: ${method.toUpperCase()} ${endpoint} ${duration}`);
        console.log('Status:', response.status);
        console.log('Data:', response.data);
        console.groupEnd();
    }
},

error: (method: string, endpoint: string, error: AxiosError, startTime?: number): void => {
    // Always log errors, even if DEBUG is false
    const duration = startTime ? `(${Date.now() - startTime}ms)` : '';
    console.group(`❌ API Error: ${method.toUpperCase()} ${endpoint} ${duration}`);
    console.log('Timestamp:', new Date().toISOString());

    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log('Status:', error.response.status);
        console.log('Data:', error.response.data);
        console.log('Headers:', error.response.headers);
    } else if (error.request) {
        // The request was made but no response was received
        console.log('No response received');
        console.log('Request:', error.request);
    } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error Message:', error.message);
    }
    console.log('Error Config:', error.config);
    console.groupEnd();
}
};

// Create axios instance with base URL
const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor for logging
// @ts-ignore
api.interceptors.request.use(
    (config: AxiosRequestConfig): AxiosRequestConfig => {
    const configWithMetadata = config as AxiosRequestConfigWithMetadata;
    const startTime = Date.now();
    configWithMetadata.metadata = { startTime };

    logger.request(config.method || 'unknown', config.url || 'unknown', config.data || config.params);

    // Dispatch request event
    dispatchApiEvent('api-request', {
        method: config.method || 'unknown',
        url: config.url || 'unknown',
        data: config.data || config.params,
        timestamp: new Date().toISOString()
    });

    return configWithMetadata;
},
    (error: AxiosError): Promise<AxiosError> => {
    logger.error('request', 'interceptor', error);
    return Promise.reject(error);
}
);

// Add response interceptor for logging
api.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => {
    const config = response.config as AxiosRequestConfigWithMetadata;
    const startTime = config.metadata?.startTime;
    const duration = startTime ? Date.now() - startTime : null;

    logger.success(config.method || 'unknown', config.url || 'unknown', response, startTime);

    // Dispatch response event
    dispatchApiEvent('api-response', {
        method: config.method || 'unknown',
        url: config.url || 'unknown',
        status: response.status,
        data: response.data,
        timestamp: new Date().toISOString(),
        duration
    });

    return response;
},
    (error: AxiosError): Promise<AxiosError> => {
    const config = error.config as AxiosRequestConfigWithMetadata;
    const startTime = config?.metadata?.startTime;
    const duration = startTime ? Date.now() - startTime : null;
    const endpoint = config?.url || 'unknown';
    const method = config?.method || 'unknown';

    logger.error(method, endpoint, error, startTime);

    // Dispatch error event
    dispatchApiEvent('api-error', {
        method,
        url: endpoint,
        error: {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        },
        timestamp: new Date().toISOString(),
        duration
    });

    return Promise.reject(error);
}
);

// Repository API types
interface Repository {
    id: string;
    name: string;
    description?: string;
    source: string;
    source_url?: string;
    file_count?: number;
    language_stats?: Record<string, number>;
    status: string;
    created_at?: string;
    updated_at?: string;
}

interface RepositoryFile {
    path: string;
    name: string;
    size: number;
    extension: string;
}

interface RepositoryFiles {
    files: RepositoryFile[];
}

interface FileContent {
    content: string;
}

// Repository APIs
export const repositoryApi = {
    // Upload a repository (either ZIP file or Git URL)
    uploadRepository: async (formData: FormData): Promise<Repository> => {
    try {
        logger.request('post', '/api/repositories', '[FormData]');
        const startTime = Date.now();

        const response = await api.post<Repository>('/api/repositories', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        logger.success('post', '/api/repositories', response, startTime);
        return response.data;
    } catch (error) {
        logger.error('post', '/api/repositories', error as AxiosError);
        throw error;
    }
},

// Get repository details
getRepository: async (repositoryId: string): Promise<Repository> => {
    try {
        const endpoint = `/api/repositories/${repositoryId}`;
        logger.request('get', endpoint);
        const startTime = Date.now();

        const response = await api.get<Repository>(endpoint);

        logger.success('get', endpoint, response, startTime);
        return response.data;
    } catch (error) {
        logger.error('get', `/api/repositories/${repositoryId}`, error as AxiosError);
        throw error;
    }
},

// List all files in a repository
getRepositoryFiles: async (repositoryId: string, filter?: string): Promise<RepositoryFiles> => {
    try {
        const endpoint = `/api/repositories/${repositoryId}/files`;
        const params = filter ? { filter } : {};
        logger.request('get', endpoint, params);
        const startTime = Date.now();

        const response = await api.get<RepositoryFiles>(endpoint, { params });

        logger.success('get', endpoint, response, startTime);
        return response.data;
    } catch (error) {
        logger.error('get', `/api/repositories/${repositoryId}/files`, error as AxiosError);
        throw error;
    }
},

// Get file content
getFileContent: async (repositoryId: string, filePath: string): Promise<FileContent> => {
    try {
        const endpoint = `/api/repositories/${repositoryId}/files/${filePath}`;
        logger.request('get', endpoint);
        const startTime = Date.now();

        const response = await api.get<FileContent>(endpoint);

        logger.success('get', endpoint, response, startTime);
        return response.data;
    } catch (error) {
        logger.error('get', `/api/repositories/${repositoryId}/files/${filePath}`, error as AxiosError);
        throw error;
    }
},

// Delete a repository
deleteRepository: async (repositoryId: string): Promise<{ detail: string }> => {
    try {
        const endpoint = `/api/repositories/${repositoryId}`;
        logger.request('delete', endpoint);
        const startTime = Date.now();

        const response = await api.delete<{ detail: string }>(endpoint);

        logger.success('delete', endpoint, response, startTime);
        return response.data;
    } catch (error) {
        logger.error('delete', `/api/repositories/${repositoryId}`, error as AxiosError);
        throw error;
    }
},
};

// Question API types
interface Question {
    id: string;
    repository_id: string;
    question: string;
    context?: string;
    created_at?: string;
    response?: QuestionResponse;
}

interface QuestionCreate {
    repository_id: string;
    question: string;
    context?: string;
}

interface CodeSnippet {
    language: string;
    code: string;
    explanation?: string;
}

interface Reference {
    type: string;
    name: string;
    description: string;
}

interface QuestionResponse {
    text_response: string;
    audio_url?: string;
    code_snippets?: CodeSnippet[];
    references?: Reference[];
}

// Question APIs
export const questionApi = {
    // Ask a question about code
    askQuestion: async (question: QuestionCreate): Promise<Question> => {
    try {
        const endpoint = '/api/questions';
        logger.request('post', endpoint, question);
        const startTime = Date.now();

        const response = await api.post<Question>(endpoint, question);

        logger.success('post', endpoint, response, startTime);
        return response.data;
    } catch (error) {
        logger.error('post', '/api/questions', error as AxiosError);
        throw error;
    }
},

// Get a specific question and its response
getQuestion: async (questionId: string): Promise<Question> => {
    try {
        const endpoint = `/api/questions/${questionId}`;
        logger.request('get', endpoint);
        const startTime = Date.now();

        const response = await api.get<Question>(endpoint);

        logger.success('get', endpoint, response, startTime);
        return response.data;
    } catch (error) {
        logger.error('get', `/api/questions/${questionId}`, error as AxiosError);
        throw error;
    }
},

// Get all questions for a repository
getRepositoryQuestions: async (repositoryId: string): Promise<Question[]> => {
    try {
        const endpoint = `/api/questions/repository/${repositoryId}`;
        logger.request('get', endpoint);
        const startTime = Date.now();

        const response = await api.get<Question[]>(endpoint);

        logger.success('get', endpoint, response, startTime);
        return response.data;
    } catch (error) {
        logger.error('get', `/api/questions/repository/${repositoryId}`, error as AxiosError);
        throw error;
    }
},
};

// Audio API types
interface AudioRequest {
    text: string;
    format?: 'mp3' | 'wav' | 'ogg';
    voice_id?: string;
}

interface AudioResponse {
    audio_url: string;
    duration_seconds: number;
    format: 'mp3' | 'wav' | 'ogg';
}

// Audio APIs
export const audioApi = {
    // Generate audio from text
    generateAudio: async (text: string, format: 'mp3' | 'wav' | 'ogg' = 'mp3'): Promise<AudioResponse> => {
    try {
        const endpoint = '/api/audio/generate';
        const data: AudioRequest = { text, format };
        logger.request('post', endpoint, data);
        const startTime = Date.now();

        const response = await api.post<AudioResponse>(endpoint, data);

        logger.success('post', endpoint, response, startTime);
        return response.data;
    } catch (error) {
        logger.error('post', '/api/audio/generate', error as AxiosError);
        throw error;
    }
},

// Get the full URL for an audio file
getAudioUrl: (audioPath: string): string => {
    const url = `${API_URL}${audioPath}`;
    if (DEBUG) {
        console.log('🔊 Audio URL:', url);
    }
    return url;
},

    // Delete an audio file
    deleteAudio: async (filename: string): Promise<{ detail: string }> => {
    try {
        const endpoint = `/api/audio/files/${filename}`;
        logger.request('delete', endpoint);
        const startTime = Date.now();

        const response = await api.delete<{ detail: string }>(endpoint);

        logger.success('delete', endpoint, response, startTime);
        return response.data;
    } catch (error) {
        logger.error('delete', `/api/audio/files/${filename}`, error as AxiosError);
        throw error;
    }
},
};

// API debug utilities
interface ApiDebug {
    setDebug: (enabled: boolean) => void;
    isDebugEnabled: () => boolean;
    clearLogs: () => void;
}

// Add debugging utilities
export const apiDebug: ApiDebug = {
    // Enable or disable debugging
    setDebug: (enabled: boolean): void => {
    window.localStorage.setItem('API_DEBUG', enabled ? 'true' : 'false');
    window.location.reload();
},

// Get current debug status
isDebugEnabled: (): boolean => {
    return DEBUG;
},

    // Clear console
    clearLogs: (): void => {
    console.clear();
    console.log('API debug logs cleared');
}
};

export default {
    repository: repositoryApi,
    question: questionApi,
    audio: audioApi,
    debug: apiDebug
};
