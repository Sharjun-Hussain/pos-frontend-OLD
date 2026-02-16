import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { saveSessionData, getSessionData, getReturnUrl, clearSessionData } from '@/lib/session-recovery';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Custom hook to handle form data persistence and restoration
 * @param {object} form - The react-hook-form instance
 * @param {string} storageKey - Unique key for local storage (optional, defaults to current path)
 */
export const useFormRestore = (form, storageKey = null) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const returnUrl = getReturnUrl();

    // Use current path as default key
    const key = storageKey || pathname;

    // 1. Auto-save form data on change (debounced)
    useEffect(() => {
        const subscription = form.watch((value) => {
            // Create a lightweight version of the data to save
            // Filter out huge objects or unnecessary fields if needed
            saveSessionData(key, value);
        });

        return () => subscription.unsubscribe();
    }, [form, key]);

    // 2. Restore data on mount if returning from login
    useEffect(() => {
        // Check if we just returned from login (by returnUrl or just check storage)
        // We can be more specific by checking a 'restored' flag in sessionStorage if needed

        // Attempt to get saved data
        const savedData = getSessionData(key);

        if (savedData) {
            console.log('Found saved session data, restoring...');

            // Prompt user or auto-restore?
            // For now, let's auto-restore and notify

            try {
                form.reset(savedData);
                toast.info("Session restored", {
                    description: "We've recovered your unsaved changes."
                });

                // Optional: Clear data after successful restore to prevent re-restoring old data
                // clearSessionData(); 
            } catch (error) {
                console.error("Failed to restore form data:", error);
            }
        }
    }, [form, key]); // Run once on mount (and when dependencies change)

    return {
        clearSavedData: clearSessionData
    };
};
