import { useSession } from 'next-auth/react';
import useSWR, { useSWRConfig } from 'swr';

export function useSettings() {
    const { data: session } = useSession();
    const { mutate } = useSWRConfig();

    const fetcher = (url) => fetch(url, {
        headers: {
            Authorization: `Bearer ${session?.user?.accessToken || session?.accessToken}`
        }
    }).then(res => res.json());

    // 1. Business Profile Settings
    const useBusinessSettings = () => {
        return useSWR(
            session ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/business` : null,
            fetcher
        );
    };

    const updateBusinessSettings = async (data) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/business`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.accessToken || session?.accessToken}`,
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.status === 'success') {
                mutate(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/business`);
                return { success: true, data: result.data };
            }
            throw new Error(result.message || 'Update failed');
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    // 2. Modular Settings (pos, receipt, etc)
    const useModularSettings = (category) => {
        return useSWR(
            session ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/${category}` : null,
            fetcher
        );
    };

    const updateModularSettings = async (category, settings_data) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/${category}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.accessToken || session?.accessToken}`,
                },
                body: JSON.stringify({ settings_data })
            });
            const result = await response.json();
            if (result.status === 'success') {
                mutate(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/${category}`);
                mutate(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/global`);
                return { success: true, data: result.data };
            }
            throw new Error(result.message || 'Update failed');
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    // 3. Global Settings (Business + All Modules)
    const useGlobalSettings = () => {
        return useSWR(
            session ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/global` : null,
            fetcher
        );
    };

    const uploadLogo = async (file) => {
        try {
            const formData = new FormData();
            formData.append('logo', file);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/logo`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session?.user?.accessToken || session?.accessToken}`,
                },
                body: formData
            });
            const result = await response.json();
            if (result.status === 'success') {
                mutate(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/business`);
                mutate(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/global`);
                return { success: true, data: result.data };
            }
            throw new Error(result.message || 'Upload failed');
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    return {
        useBusinessSettings,
        updateBusinessSettings,
        useModularSettings,
        updateModularSettings,
        useGlobalSettings,
        uploadLogo
    };
}
