import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { MO_MARKET_CATEGORIES } from "./marketsConfig";

// Lazy Load Views for Anti-Throttling & Chunking
// Lazy Load Views for Anti-Throttling & Chunking
const GenericCategoryView = lazy(() => import("./categories/GenericCategoryView").then(m => ({ default: m.GenericCategoryView })));
const SportsIndex = lazy(() => import("./categories/sports/index"));
const SignalsView = lazy(() => import("./categories/signals/index"));
const PoliticsPage = lazy(() => import("./categories/politics/index"));

// New Algorithmic Layouts
const TopMarketsLayout = lazy(() => import("./categories/TopMarketsLayout").then(m => ({ default: m.TopMarketsLayout })));
const ForYouLayout = lazy(() => import("./categories/ForYouLayout").then(m => ({ default: m.ForYouLayout })));

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
                    // Specific overrides to avoid prop mismatch types
                    if (category.id === "top_markets") {
                        return <Route key={category.id} index element={<TopMarketsLayout />} />;
                    }
                    if (category.id === "for_you") {
                        return <Route key={category.id} path={category.path} element={<ForYouLayout />} />;
                    }

                    // Logic to select component based on category ID
                    let Element = GenericCategoryView;
                    if (category.id === "sports") Element = SportsIndex;
                    if (category.id === "signals") Element = SignalsView;
                    if (category.id === "politics") Element = PoliticsPage;

                    // Root path handling (should be covered by top_pics above, but safe fallback)
                    if (category.path === "") {
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
