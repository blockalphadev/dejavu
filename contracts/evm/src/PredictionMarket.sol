// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title DeJaVu Prediction Market
 * @notice Core prediction market contract for DeJaVu platform
 * @dev This is a scaffold contract - implementation to be completed
 */
contract PredictionMarket {
    // ============================================================================
    // Types
    // ============================================================================

    enum MarketStatus {
        Active,
        Closed,
        Resolved,
        Disputed
    }

    struct Market {
        uint256 id;
        string title;
        string description;
        uint256 createdAt;
        uint256 endTime;
        uint256 resolutionTime;
        MarketStatus status;
        uint256 totalVolume;
        uint256 totalLiquidity;
        address creator;
    }

    struct Outcome {
        uint256 id;
        string name;
        uint256 totalShares;
        uint256 price; // In basis points (10000 = 100%)
    }

    // ============================================================================
    // State Variables
    // ============================================================================

    uint256 public nextMarketId;
    mapping(uint256 => Market) public markets;
    mapping(uint256 => Outcome[]) public marketOutcomes;
    mapping(uint256 => mapping(address => mapping(uint256 => uint256))) public userShares;
    
    address public owner;
    address public oracle;
    uint256 public platformFee; // In basis points

    // ============================================================================
    // Events
    // ============================================================================

    event MarketCreated(
        uint256 indexed marketId,
        address indexed creator,
        string title,
        uint256 endTime
    );

    event SharesPurchased(
        uint256 indexed marketId,
        uint256 indexed outcomeId,
        address indexed buyer,
        uint256 shares,
        uint256 cost
    );

    event SharesSold(
        uint256 indexed marketId,
        uint256 indexed outcomeId,
        address indexed seller,
        uint256 shares,
        uint256 proceeds
    );

    event MarketResolved(
        uint256 indexed marketId,
        uint256 indexed winningOutcome
    );

    event WinningsClaimed(
        uint256 indexed marketId,
        address indexed user,
        uint256 amount
    );

    // ============================================================================
    // Modifiers
    // ============================================================================

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == oracle, "Not oracle");
        _;
    }

    modifier marketExists(uint256 marketId) {
        require(markets[marketId].id == marketId, "Market does not exist");
        _;
    }

    modifier marketActive(uint256 marketId) {
        require(markets[marketId].status == MarketStatus.Active, "Market not active");
        require(block.timestamp < markets[marketId].endTime, "Market ended");
        _;
    }

    // ============================================================================
    // Constructor
    // ============================================================================

    constructor(address _oracle, uint256 _platformFee) {
        owner = msg.sender;
        oracle = _oracle;
        platformFee = _platformFee;
    }

    // ============================================================================
    // External Functions
    // ============================================================================

    /**
     * @notice Create a new prediction market
     * @param title Market title
     * @param description Market description
     * @param endTime Timestamp when trading ends
     * @param outcomeNames Array of outcome names
     */
    function createMarket(
        string calldata title,
        string calldata description,
        uint256 endTime,
        string[] calldata outcomeNames
    ) external returns (uint256 marketId) {
        require(endTime > block.timestamp, "End time must be in future");
        require(outcomeNames.length >= 2, "Need at least 2 outcomes");

        marketId = nextMarketId++;
        
        markets[marketId] = Market({
            id: marketId,
            title: title,
            description: description,
            createdAt: block.timestamp,
            endTime: endTime,
            resolutionTime: 0,
            status: MarketStatus.Active,
            totalVolume: 0,
            totalLiquidity: 0,
            creator: msg.sender
        });

        uint256 initialPrice = 10000 / outcomeNames.length;
        for (uint256 i = 0; i < outcomeNames.length; i++) {
            marketOutcomes[marketId].push(Outcome({
                id: i,
                name: outcomeNames[i],
                totalShares: 0,
                price: initialPrice
            }));
        }

        emit MarketCreated(marketId, msg.sender, title, endTime);
    }

    /**
     * @notice Buy shares for an outcome
     * @param marketId Market ID
     * @param outcomeId Outcome ID
     * @param shares Number of shares to buy
     */
    function buyShares(
        uint256 marketId,
        uint256 outcomeId,
        uint256 shares
    ) external payable marketExists(marketId) marketActive(marketId) {
        require(outcomeId < marketOutcomes[marketId].length, "Invalid outcome");
        require(shares > 0, "Must buy at least 1 share");

        // TODO: Implement AMM pricing logic
        uint256 cost = _calculateBuyCost(marketId, outcomeId, shares);
        require(msg.value >= cost, "Insufficient payment");

        userShares[marketId][msg.sender][outcomeId] += shares;
        marketOutcomes[marketId][outcomeId].totalShares += shares;
        markets[marketId].totalVolume += cost;

        // Refund excess
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }

        emit SharesPurchased(marketId, outcomeId, msg.sender, shares, cost);
    }

    // ============================================================================
    // View Functions
    // ============================================================================

    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    function getOutcomes(uint256 marketId) external view returns (Outcome[] memory) {
        return marketOutcomes[marketId];
    }

    function getUserShares(
        uint256 marketId,
        address user,
        uint256 outcomeId
    ) external view returns (uint256) {
        return userShares[marketId][user][outcomeId];
    }

    // ============================================================================
    // Internal Functions
    // ============================================================================

    function _calculateBuyCost(
        uint256 marketId,
        uint256 outcomeId,
        uint256 shares
    ) internal view returns (uint256) {
        // Placeholder - implement LMSR or other AMM
        Outcome memory outcome = marketOutcomes[marketId][outcomeId];
        return (outcome.price * shares) / 10000;
    }

    // ============================================================================
    // Admin Functions
    // ============================================================================

    function setOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
    }

    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        platformFee = _fee;
    }
}
