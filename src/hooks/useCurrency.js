import { useSettingsStore } from "@/store/useSettingsStore";

export function useCurrency() {
    const { global } = useSettingsStore();

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return "";

        const currencyCode = global.currency || "LKR";

        try {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currencyCode,
            }).format(amount);
        } catch (error) {
            // Fallback if currency code is invalid
            return `${currencyCode} ${Number(amount).toFixed(2)}`;
        }
    };

    return {
        formatCurrency,
        currency: global.currency,
    };
}
