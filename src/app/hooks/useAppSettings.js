import { useSettings } from "./swr/useSettings";
import { useMemo } from "react";
import { format } from "date-fns";

export function useAppSettings() {
    const { useGlobalSettings } = useSettings();
    const { data: response, isLoading, mutate } = useGlobalSettings();

    const appSettings = useMemo(() => {
        const data = response?.data || {};
        const business = data.business || {};
        const general = data.modules?.general || {};
        const pos = data.modules?.pos || {};

        const localization = general.localization || {
            currency: "LKR",
            timeZone: "Asia/Kolkata",
            dateFormat: "dmy",
            timeFormat: "12"
        };

        const finance = general.finance || { precision: 2, currencyPos: "before" };
        const prefixes = general.prefixes || { sale: "INV", purchase: "PO", customer: "CUS" };

        return {
            business,
            general,
            pos,
            localization,
            finance,
            prefixes,
            bankAccounts: general.bankAccounts || []
        };
    }, [response]);

    const formatCurrency = (amount) => {
        const { localization, finance } = appSettings;
        const currencies = [
            { code: "LKR", symbol: "Rs" },
            { code: "USD", symbol: "$" },
            { code: "EUR", symbol: "€" },
            { code: "GBP", symbol: "£" },
            { code: "INR", symbol: "₹" },

        ];

        const found = currencies.find(c => c.code === localization.currency) || { symbol: "Rs" };
        const val = parseFloat(amount || 0).toLocaleString(undefined, {
            minimumFractionDigits: parseInt(finance.precision),
            maximumFractionDigits: parseInt(finance.precision)
        });

        if (finance.currencyPos === "before") return `${found.symbol} ${val}`;
        return `${val} ${found.symbol}`;
    };

    const formatDate = (date) => {
        if (!date) return "-";
        const { dateFormat, timeZone } = appSettings.localization;
        const d = new Date(date);

        const options = { timeZone };

        try {
            switch (dateFormat) {
                case 'dmy':
                    return new Intl.DateTimeFormat('en-GB', { ...options, day: '2-digit', month: '2-digit', year: 'numeric' }).format(d).replace(/\//g, '-');
                case 'mdy':
                    return new Intl.DateTimeFormat('en-US', { ...options, day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
                case 'ymd':
                    return new Intl.DateTimeFormat('sv-SE', { ...options, day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
                default:
                    return new Intl.DateTimeFormat('en-GB', { ...options, day: '2-digit', month: '2-digit', year: 'numeric' }).format(d).replace(/\//g, '-');
            }
        } catch (e) {
            console.error("Date formatting error:", e);
            return format(d, "dd-MM-yyyy");
        }
    };

    const formatDateTime = (date) => {
        if (!date) return "-";
        const { dateFormat, timeFormat, timeZone } = appSettings.localization;
        const d = new Date(date);

        try {
            const dateOptions = { timeZone };
            let dateStr;
            switch (dateFormat) {
                case 'dmy': dateStr = new Intl.DateTimeFormat('en-GB', { ...dateOptions, day: '2-digit', month: '2-digit', year: 'numeric' }).format(d).replace(/\//g, '-'); break;
                case 'mdy': dateStr = new Intl.DateTimeFormat('en-US', { ...dateOptions, day: '2-digit', month: '2-digit', year: 'numeric' }).format(d); break;
                case 'ymd': dateStr = new Intl.DateTimeFormat('sv-SE', { ...dateOptions, day: '2-digit', month: '2-digit', year: 'numeric' }).format(d); break;
                default: dateStr = new Intl.DateTimeFormat('en-GB', { ...dateOptions, day: '2-digit', month: '2-digit', year: 'numeric' }).format(d).replace(/\//g, '-');
            }

            const timeOptions = {
                timeZone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: timeFormat === "12"
            };
            const timeStr = new Intl.DateTimeFormat('en-US', timeOptions).format(d);

            return `${dateStr} ${timeStr}`;
        } catch (e) {
            console.error("DateTime formatting error:", e);
            return format(d, "dd-MM-yyyy HH:mm");
        }
    };

    const getPrefix = (type) => appSettings.prefixes[type] || "";

    const generateDocNumber = (type, number) => {
        const prefix = getPrefix(type);
        return `${prefix}${String(number).padStart(5, '0')}`;
    };

    return {
        ...appSettings,
        isLoading,
        formatCurrency,
        formatDate,
        formatDateTime,
        getPrefix,
        generateDocNumber,
        refreshSettings: mutate
    };
}
