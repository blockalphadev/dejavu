import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { MO_MARKET_CATEGORIES } from "./marketsConfig";

// Lazy Load Views for Anti-Throttling & Chunking
// Lazy Load Views for Anti-Throttling & Chunking
const GenericCategoryView = lazy(() => import("./categories/GenericCategoryView").then(m => ({ default: m.GenericCategoryView }))); // Keep generic for fallback
const SportsIndex = lazy(() => import("./categories/sports/index"));
const SignalsView = lazy(() => import("./categories/signals/index"));
// We can lazily import others if we want to be explicit, but map uses Generic by default
// To fully use the structure, we should map them below.

function MarketLoader() {
    return (
        <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" />
        </div>
    );
}

export function MarketsIndex() {
    return (
        <Suspense fallback={<MarketLoader />}>
            <Routes>
                {MO_MARKET_CATEGORIES.map((category) => {
                    // Logic to select component based on category ID
                    let Element = GenericCategoryView;
                    if (category.id === "sports") Element = SportsIndex; // Use SportsIndex for nested routes
                    if (category.id === "signals") Element = SignalsView;

                    // We could map others here if we imported them specifically, e.g.:
                    // if (category.id === "politics") Element = PoliticsPage;
                    // For now, GenericCategoryView is fine for simple ones unless user wants specific imports used.
                    // Given the user wants "comprehensive", let's load them dynamically? 
                    // React.lazy in a loop is tricky. 
                    // Let's stick to the mapped overrides or fallback to Generic.

                    // Root path handling
                    if (category.path === "") {
                        // Top Markets View at /markets/
                        return <Route key={category.id} index element={<Element category={category.id} />} />;
                    }

                    // Sub-routes handling
                    return (
                        <Route
                            key={category.id}
                            path={category.path}
                            element={<Element category={category.id} />}
                        />
                    );
                })}
                {/* Fallback */}
                <Route path="*" element={<Navigate to="" replace />} />
            </Routes>
        </Suspense>
    );
}
