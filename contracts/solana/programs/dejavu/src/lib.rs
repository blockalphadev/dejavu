//! DeJaVu Prediction Market - Solana Program
//!
//! This is the core Anchor program for the DeJaVu prediction market on Solana.

use anchor_lang::prelude::*;

declare_id!("DeJaVuXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

/// DeJaVu Prediction Market Program
#[program]
pub mod dejavu {
    use super::*;

    /// Initialize a new prediction market
    pub fn create_market(
        ctx: Context<CreateMarket>,
        title: String,
        description: String,
        end_time: i64,
        outcome_names: Vec<String>,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let clock = Clock::get()?;

        require!(end_time > clock.unix_timestamp, MarketError::InvalidEndTime);
        require!(outcome_names.len() >= 2, MarketError::InsufficientOutcomes);
        require!(outcome_names.len() <= 10, MarketError::TooManyOutcomes);

        market.authority = ctx.accounts.authority.key();
        market.title = title;
        market.description = description;
        market.created_at = clock.unix_timestamp;
        market.end_time = end_time;
        market.status = MarketStatus::Active;
        market.total_volume = 0;
        market.total_liquidity = 0;
        market.outcome_count = outcome_names.len() as u8;
        market.bump = ctx.bumps.market;

        msg!("Market created: {}", market.title);
        Ok(())
    }

    /// Buy shares for an outcome
    pub fn buy_shares(
        ctx: Context<BuyShares>,
        outcome_id: u8,
        shares: u64,
    ) -> Result<()> {
        let market = &ctx.accounts.market;
        let clock = Clock::get()?;

        require!(
            market.status == MarketStatus::Active,
            MarketError::MarketNotActive
        );
        require!(
            clock.unix_timestamp < market.end_time,
            MarketError::MarketEnded
        );
        require!(
            outcome_id < market.outcome_count,
            MarketError::InvalidOutcome
        );
        require!(shares > 0, MarketError::InvalidShares);

        // TODO: Implement AMM pricing and token transfers

        msg!("Shares purchased: {} for outcome {}", shares, outcome_id);
        Ok(())
    }

    /// Resolve a market with the winning outcome
    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        winning_outcome: u8,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let clock = Clock::get()?;

        require!(
            market.status == MarketStatus::Active,
            MarketError::MarketNotActive
        );
        require!(
            clock.unix_timestamp >= market.end_time,
            MarketError::MarketNotEnded
        );
        require!(
            winning_outcome < market.outcome_count,
            MarketError::InvalidOutcome
        );

        market.status = MarketStatus::Resolved;
        market.winning_outcome = Some(winning_outcome);
        market.resolution_time = Some(clock.unix_timestamp);

        msg!("Market resolved with outcome: {}", winning_outcome);
        Ok(())
    }
}

// ============================================================================
// Accounts
// ============================================================================

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = Market::LEN,
        seeds = [b"market", authority.key().as_ref(), title.as_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyShares<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(
        mut,
        constraint = market.authority == authority.key() @ MarketError::Unauthorized
    )]
    pub market: Account<'info, Market>,

    pub authority: Signer<'info>,
}

// ============================================================================
// State
// ============================================================================

#[account]
pub struct Market {
    pub authority: Pubkey,
    pub title: String,
    pub description: String,
    pub created_at: i64,
    pub end_time: i64,
    pub resolution_time: Option<i64>,
    pub status: MarketStatus,
    pub total_volume: u64,
    pub total_liquidity: u64,
    pub outcome_count: u8,
    pub winning_outcome: Option<u8>,
    pub bump: u8,
}

impl Market {
    pub const LEN: usize = 8 // discriminator
        + 32 // authority
        + 4 + 100 // title (max 100 chars)
        + 4 + 500 // description (max 500 chars)
        + 8 // created_at
        + 8 // end_time
        + 1 + 8 // resolution_time (Option<i64>)
        + 1 // status
        + 8 // total_volume
        + 8 // total_liquidity
        + 1 // outcome_count
        + 1 + 1 // winning_outcome (Option<u8>)
        + 1; // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MarketStatus {
    Active,
    Closed,
    Resolved,
    Disputed,
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum MarketError {
    #[msg("Invalid end time - must be in the future")]
    InvalidEndTime,
    #[msg("Need at least 2 outcomes")]
    InsufficientOutcomes,
    #[msg("Maximum 10 outcomes allowed")]
    TooManyOutcomes,
    #[msg("Market is not active")]
    MarketNotActive,
    #[msg("Market has ended")]
    MarketEnded,
    #[msg("Market has not ended yet")]
    MarketNotEnded,
    #[msg("Invalid outcome ID")]
    InvalidOutcome,
    #[msg("Invalid share amount")]
    InvalidShares,
    #[msg("Unauthorized")]
    Unauthorized,
}
