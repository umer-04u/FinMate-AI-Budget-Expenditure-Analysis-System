import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const endpoints = {
    checkAnomaly: '/analyze/anomaly',
    predictSpending: '/predict/spending',
    categorize: '/categorize',
    getTransactions: '/transactions',
    addTransaction: '/transactions',
    chat: '/chat',
};

// Helper function to handle API errors
export const handleApiError = (error) => {
    console.error("API Error:", error);
    throw error;
};
