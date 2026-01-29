import { CategoryPage } from "../CategoryPage";
import { useAdvancedMarketRanking } from "../../../hooks/useAdvancedMarketRanking";

export function ForYouLayout() {
    const { forYouMarkets, isLoading } = useAdvancedMarketRanking();

    return (
        <CategoryPage
            category="for_you"
            title="Recommended For You"
            overrideMarkets={forYouMarkets}
            isLoadingOverride={isLoading}
        />
    );
}
