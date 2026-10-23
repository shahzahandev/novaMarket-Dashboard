import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useApiConfig, adminFetch } from "@/context/ApiContext";

const StoreInfoContext = createContext(null);

// Server kokhono kokhono JSON dey na (Render cold start / crash), tai safe parse
const safeJson = async (response) => {
    try {
        return await response.json();
    } catch {
        return null;
    }
};

export function StoreInfoProvider({ children }) {
    const { API_BASE } = useApiConfig();
    const GET_URL = `${API_BASE}/store/getStoreInfo`;
    const [storeInfo, setStoreInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchStoreInfo = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await adminFetch(GET_URL);

            // DB clear thakle backend 404 dey -> eta error na, shudhu "not created"
            if (response.status === 404) {
                setStoreInfo(null);
                return;
            }

            const data = await safeJson(response);

            if (!response.ok) {
                throw new Error(data?.message || "Failed to load store information.");
            }

            setStoreInfo(data?.storeInfo || null);
        } catch (err) {
            console.error("Store info fetch error:", err);
            setError(err.message || "Failed to load store information.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStoreInfo();
    }, [fetchStoreInfo]);

    const value = useMemo(
        () => ({
            storeInfo,
            exists: Boolean(storeInfo),
            setStoreInfo, // save-er por call korle puro app instantly update hobe
            loading,
            error,
            refetchStoreInfo: fetchStoreInfo,
        }),
        [storeInfo, loading, error, fetchStoreInfo]
    );

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
