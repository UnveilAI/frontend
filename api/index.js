// Integrating with the FastAPI backend from Next.js
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with base URL
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Repository APIs
export const repositoryApi = {
    // Upload a repository (either ZIP file or Git URL)
    uploadRepository: async (formData) => {
        const response = await api.post('/api/repositories', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Get repository details
    getRepository: async (repositoryId) => {
        const response = await api.get(`/api/repositories/${repositoryId}`);
        return response.data;
    },

    // List all files in a repository
    getRepositoryFiles: async (repositoryId, filter) => {
        const params = filter ? { filter } : {};
        const response = await api.get(`/api/repositories/${repositoryId}/files`, { params });
        return response.data;
    },

    // Get file content
    getFileContent: async (repositoryId, filePath) => {
        const response = await api.get(`/api/repositories/${repositoryId}/files/${filePath}`);
        return response.data;
    },

    // Delete a repository
    deleteRepository: async (repositoryId) => {
        const response = await api.delete(`/api/repositories/${repositoryId}`);
        return response.data;
    },
};

// Question APIs
export const questionApi = {
    // Ask a question about code
    askQuestion: async (question) => {
        const response = await api.post('/api/questions', question);
        return response.data;
    },

    // Get a specific question and its response
    getQuestion: async (questionId) => {
        const response = await api.get(`/api/questions/${questionId}`);
        return response.data;
    },

    // Get all questions for a repository
    getRepositoryQuestions: async (repositoryId) => {
        const response = await api.get(`/api/questions/repository/${repositoryId}`);
        return response.data;
    },
};

// Audio APIs
export const audioApi = {
    // Generate audio from text
    generateAudio: async (text, format = 'mp3') => {
        const response = await api.post('/api/audio/generate', { text, format });
        return response.data;
    },

    // Get the full URL for an audio file
    getAudioUrl: (audioPath) => {
        return `${API_URL}${audioPath}`;
    },

    // Delete an audio file
    deleteAudio: async (filename) => {
        const response = await api.delete(`/api/audio/files/${filename}`);
        return response.data;
    },
};

export default {
    repository: repositoryApi,
    question: questionApi,
    audio: audioApi,
};
