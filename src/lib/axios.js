import axios from 'axios';
import { saveSessionData } from './session-recovery';

// create axios instance with base URL if needed
// const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
    // baseURL,
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Check for 401 Unauthorized or 403 Forbidden
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {

            // We are in the browser
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;

                // Don't loop if already on login
                if (!currentPath.includes('/login')) {
                    // Attempt to finding form data in the DOM to save
                    // This is a best-effort approach since React state is hard to access from outside
                    // Real restoration relies more on the hook component auto-saving

                    // Redirect to login with return path
                    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
