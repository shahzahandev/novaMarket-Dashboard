import { createContext, useCallback, useContext, useEffect, useState } from "react";

const API_ORIGIN = "https://nova-market-backend-2.onrender.com";
const GET_URL = `${API_ORIGIN}/api/v1/store/getStoreInfo`;

const StoreInfoContext = createContext(null);

export function StoreInfoProvider({ children }) {
    const [storeInfo, setStoreInfo] = useState(null); // null = ekhono create hoyni
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchStoreInfo = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(GET_URL);
            if (response.status === 404) {
                setStoreInfo(null);
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || "Failed to load store information.");
            }

            setStoreInfo(data?.storeInfo || null);
        } catch (err) {
            console.error("Store info fetch error:", err);
            setError(err.message || "Store information load kora jayni.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStoreInfo();
    }, [fetchStoreInfo]);

    const value = {
        storeInfo,
        setStoreInfo, // save-er por eta call korle sob jaygay instantly update hobe
        loading,
        error,
        refetchStoreInfo: fetchStoreInfo,
    };

    return (
        <StoreInfoContext.Provider value={value}>
            {children}
        </StoreInfoContext.Provider>
    );
}

export function useStoreInfo() {
    const context = useContext(StoreInfoContext);

    if (!context) {
        throw new Error("useStoreInfo must be used inside <StoreInfoProvider>");
    }

    return context;
}