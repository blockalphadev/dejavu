/// DeJaVu Prediction Market - Sui Move Module
/// 
/// Core prediction market contract for the DeJaVu platform on Sui.
module dejavu::prediction_market {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::event;
    use std::string::{Self, String};
    use std::vector;
    use std::option::{Self, Option};

    // ============================================================================
    // Errors
    // ============================================================================
    
    const EInvalidEndTime: u64 = 1;
    const EInsufficientOutcomes: u64 = 2;
    const ETooManyOutcomes: u64 = 3;
    const EMarketNotActive: u64 = 4;
    const EMarketEnded: u64 = 5;
    const EMarketNotEnded: u64 = 6;
    const EInvalidOutcome: u64 = 7;
    const EInvalidShares: u64 = 8;
    const EUnauthorized: u64 = 9;

    // ============================================================================
    // Constants
    // ============================================================================

    const STATUS_ACTIVE: u8 = 0;
    const STATUS_CLOSED: u8 = 1;
    const STATUS_RESOLVED: u8 = 2;
    const STATUS_DISPUTED: u8 = 3;

    // ============================================================================
    // Objects
    // ============================================================================

    /// Market admin capability
    public struct AdminCap has key, store {
        id: UID,
    }

    /// Prediction market object
    public struct Market has key, store {
        id: UID,
        title: String,
        description: String,
        creator: address,
        created_at: u64,
        end_time: u64,
        resolution_time: Option<u64>,
        status: u8,
        outcome_names: vector<String>,
        outcome_shares: vector<u64>,
        total_volume: u64,
        treasury: Balance<SUI>,
        winning_outcome: Option<u8>,
    }

    /// User position in a market
    public struct Position has key, store {
        id: UID,
        market_id: ID,
        owner: address,
        outcome_id: u8,
        shares: u64,
        average_price: u64,
    }

    // ============================================================================
    // Events
    // ============================================================================

    public struct MarketCreated has copy, drop {
        market_id: ID,
        creator: address,
        title: String,
        end_time: u64,
    }

    public struct SharesPurchased has copy, drop {
        market_id: ID,
        buyer: address,
        outcome_id: u8,
        shares: u64,
        cost: u64,
    }

    public struct MarketResolved has copy, drop {
        market_id: ID,
        winning_outcome: u8,
    }

    // ============================================================================
    // Init
    // ============================================================================

    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    // ============================================================================
    // Public Functions
    // ============================================================================

    /// Create a new prediction market
    public entry fun create_market(
        title: vector<u8>,
        description: vector<u8>,
        end_time: u64,
        outcome_names: vector<vector<u8>>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let current_time = clock::timestamp_ms(clock);
        assert!(end_time > current_time, EInvalidEndTime);
        assert!(vector::length(&outcome_names) >= 2, EInsufficientOutcomes);
        assert!(vector::length(&outcome_names) <= 10, ETooManyOutcomes);

        let mut outcome_strings = vector::empty<String>();
        let mut outcome_shares = vector::empty<u64>();
        let mut i = 0;
        let len = vector::length(&outcome_names);
        
        while (i < len) {
            vector::push_back(&mut outcome_strings, string::utf8(*vector::borrow(&outcome_names, i)));
            vector::push_back(&mut outcome_shares, 0);
            i = i + 1;
        };

        let market = Market {
            id: object::new(ctx),
            title: string::utf8(title),
            description: string::utf8(description),
            creator: tx_context::sender(ctx),
            created_at: current_time,
            end_time,
            resolution_time: option::none(),
            status: STATUS_ACTIVE,
            outcome_names: outcome_strings,
            outcome_shares,
            total_volume: 0,
            treasury: balance::zero(),
            winning_outcome: option::none(),
        };

        let market_id = object::id(&market);
        
        event::emit(MarketCreated {
            market_id,
            creator: tx_context::sender(ctx),
            title: string::utf8(title),
            end_time,
        });

        transfer::share_object(market);
    }

    /// Buy shares for an outcome
    public entry fun buy_shares(
        market: &mut Market,
        outcome_id: u8,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let current_time = clock::timestamp_ms(clock);
        assert!(market.status == STATUS_ACTIVE, EMarketNotActive);
        assert!(current_time < market.end_time, EMarketEnded);
        assert!((outcome_id as u64) < vector::length(&market.outcome_names), EInvalidOutcome);

        let cost = coin::value(&payment);
        assert!(cost > 0, EInvalidShares);

        // Calculate shares based on cost (simplified - implement AMM later)
        let shares = cost; // 1:1 for now

        // Update market state
        let outcome_shares = vector::borrow_mut(&mut market.outcome_shares, (outcome_id as u64));
        *outcome_shares = *outcome_shares + shares;
        market.total_volume = market.total_volume + cost;

        // Add to treasury
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut market.treasury, payment_balance);

        // Create position for user
        let position = Position {
            id: object::new(ctx),
            market_id: object::id(market),
            owner: tx_context::sender(ctx),
            outcome_id,
            shares,
            average_price: 10000 / (vector::length(&market.outcome_names) as u64), // Equal odds initially
        };

        event::emit(SharesPurchased {
            market_id: object::id(market),
            buyer: tx_context::sender(ctx),
            outcome_id,
            shares,
            cost,
        });

        transfer::transfer(position, tx_context::sender(ctx));
    }

    /// Resolve market with winning outcome (admin only)
    public entry fun resolve_market(
        _admin: &AdminCap,
        market: &mut Market,
        winning_outcome: u8,
        clock: &Clock,
    ) {
        let current_time = clock::timestamp_ms(clock);
        assert!(market.status == STATUS_ACTIVE, EMarketNotActive);
        assert!(current_time >= market.end_time, EMarketNotEnded);
        assert!((winning_outcome as u64) < vector::length(&market.outcome_names), EInvalidOutcome);

        market.status = STATUS_RESOLVED;
        market.winning_outcome = option::some(winning_outcome);
        market.resolution_time = option::some(current_time);

        event::emit(MarketResolved {
            market_id: object::id(market),
            winning_outcome,
        });
    }

    // ============================================================================
    // View Functions
    // ============================================================================

    public fun get_title(market: &Market): &String {
        &market.title
    }

    public fun get_status(market: &Market): u8 {
        market.status
    }

    public fun get_total_volume(market: &Market): u64 {
        market.total_volume
    }

    public fun get_winning_outcome(market: &Market): Option<u8> {
        market.winning_outcome
    }
}
