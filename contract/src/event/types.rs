use crate::types::TimestampMs;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::Vector;
use near_sdk::json_types::U128;
use near_sdk::{
    serde::{Deserialize, Serialize},
    AccountId,
};

pub type EventId = u64;

#[derive(BorshDeserialize, BorshSerialize)]
pub struct Event {
    pub id: EventId,
    pub owner_id: AccountId,
    pub title: String,
    pub description: String,
    pub is_visible: bool,
    pub started_at: TimestampMs,
    pub ended_at: TimestampMs,
    pub raffled: bool,
    pub prizes: Vector<Prize>,
}

/**
 * retrieved by view methods
 */
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct JsonEvent {
    pub id: EventId,
    pub title: String,
    pub description: String,
    pub started_at: TimestampMs,
    pub ended_at: TimestampMs,
    pub status: EventStatus,
    pub prizes: Vec<Prize>,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub enum EventStatus {
    Configuration, // owner can change params
    Visible,       // anyone is able to get event data
    Active,        // anyone who met coniditions is able to join event
    Raffling,      // can't join, owner can raffle prizes
    End,           // nothing is able
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde", tag = "type")]
pub struct EventPrize {
    pub event_id: EventId,
    pub prize_index: u64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde", tag = "type")]
pub enum PrizeType {
    NEAR { amount: U128 },
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Prize {
    pub prize_type: PrizeType,
    pub winner_account_id: Option<AccountId>,
}
