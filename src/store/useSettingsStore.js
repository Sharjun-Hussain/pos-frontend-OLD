import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useSettingsStore = create(
    persist(
        (set) => ({
            // Global Settings
            global: {
                appName: 'EMI POS',
                currency: 'USD',
                language: 'en',
                theme: 'light',
                zoomLevel: 1,
            },
            setGlobalSettings: (settings) =>
                set((state) => ({
                    global: typeof settings === 'object' && settings !== null
                        ? { ...state.global, ...settings }
                        : state.global
                })),

            // Business Settings
            business: {
                businessName: 'My Store',
                businessType: 'retail',
                email: 'contact@mystore.com',
                phone: '+1 (555) 123-4567',
                address: '123 Main Street',
                city: 'New York',
                state: 'NY',
                zipCode: '10001',
                country: 'United States',
                website: 'www.mystore.com',
                taxId: '',
                logo: null,
            },
            setBusinessSettings: (settings) =>
                set((state) => ({
                    business: typeof settings === 'object' && settings !== null
                        ? { ...state.business, ...settings }
                        : state.business
                })),

            // POS Settings
            pos: {
                enableSound: true,
                showDiscount: true,
                showTax: true,
                defaultPaymentMethod: 'cash',
            },
            setPosSettings: (settings) =>
                set((state) => ({
                    pos: typeof settings === 'object' && settings !== null
                        ? { ...state.pos, ...settings }
                        : state.pos
                })),

            // Communication Settings
            email: {
                provider: 'smtp', // smtp, sendgrid, mailgun, ses
                enabled: true,
                config: {}, // For provider specific config
                // Legacy/SMTP specific fields (kept for backward compatibility or mapped)
                smtpHost: '',
                smtpPort: '587',
                smtpUser: '',
                smtpPassword: '',
                fromEmail: '',
                fromName: '',
                enableSsl: true,
            },
            setEmailSettings: (settings) =>
                set((state) => ({ email: { ...state.email, ...settings } })),

            sms: {
                provider: 'twilio', // twilio, nexmo
                enabled: false,
                config: {},
            },
            setSmsSettings: (settings) =>
                set((state) => ({ sms: { ...state.sms, ...settings } })),

            // Receipt Settings
            receipt: {
                showHeader: true,
                showFooter: true,
                headerText: 'Welcome to our store!',
                footerText: 'Thank you for your business!',
                showLogo: true,
                logoUrl: '',
                paperWidth: '80mm',
                fontSize: 'medium',
                showTax: true,
                showDiscount: true,
                showSeller: true,
                showCustomer: true,
                autoPrintReceipt: true,
            },
            setReceiptSettings: (settings) =>
                set((state) => ({
                    receipt: typeof settings === 'object' && settings !== null
                        ? { ...state.receipt, ...settings }
                        : state.receipt
                })),
        }),
        {
            name: 'pos-settings-storage', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
        }
    )
);
