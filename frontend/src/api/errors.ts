import axios from 'axios';

export function extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        if (Array.isArray(message)) return message.join('; ');
        if (typeof message === 'string') return message;
        return error.message;
    }
    if (error instanceof Error) return error.message;
    return 'Unknown error';
}