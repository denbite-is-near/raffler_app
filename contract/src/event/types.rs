use crate::types::TimestampMs;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{UnorderedSet, Vector};
use near_sdk::json_types::U128;
use near_sdk::{
    serde::{Deserialize, Serialize},
    AccountId,
};
use witgen::witgen;

// min prize amount is 0.1N
pub const MIN_NEAR_PRIZE_AMOUNT: u128 = 100_000_000_000_000_000_000_000;

#[witgen]
pub type EventId = u64;

#[witgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Event {
    pub id: EventId,
    pub owner_id: AccountId,
    pub title: String,
    pub is_visible: bool,
    pub started_at: TimestampMs,
    pub ended_at: TimestampMs,
    pub raffled: bool,
    pub participants: UnorderedSet<AccountId>,
    pub prizes: Vector<Prize>,
}

#[witgen]
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct JsonEvent {
    pub id: EventId,
    pub title: String,
    pub started_at: TimestampMs,
    pub ended_at: TimestampMs,
    pub status: EventStatus,
    pub prizes: Vec<Prize>,
    pub participants_amount: u64,
}

#[witgen]
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Debug, PartialEq)]
#[serde(crate = "near_sdk::serde")]
pub enum EventStatus {
    Configuration, // owner can change params
    Visible,       // anyone is able to get event data
    Active,        // anyone who met coniditions is able to join event
    Raffling,      // can't join, owner can raffle prizes
    Claiming,      // nothing is able
}

impl std::fmt::Display for EventStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match *self {
            EventStatus::Configuration => write!(f, "Configuration"),
            EventStatus::Visible => write!(f, "Visible"),
            EventStatus::Active => write!(f, "Active"),
            EventStatus::Raffling => write!(f, "Raffling"),
            EventStatus::Claiming => write!(f, "Claiming"),
        }
    }
}

#[witgen]
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, PartialEq)]
#[serde(crate = "near_sdk::serde", tag = "type")]
pub struct EventPrize {
    pub event_id: EventId,
    pub prize_index: u64,
}

#[witgen]
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, Debug)]
#[serde(crate = "near_sdk::serde", tag = "type")]
pub enum PrizeType {
    NEAR { amount: U128 },
}

#[witgen]
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct Prize {
    pub prize_type: PrizeType,
    pub winner_account_id: Option<AccountId>,
    pub claimed: bool,
}
