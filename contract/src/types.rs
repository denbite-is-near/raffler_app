use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    serde::{Deserialize, Serialize},
};

// constants
pub const DEFAULT_PAGINATION_LIMIT: u64 = 5;
pub const MAX_PAGINATION_LIMIT: u64 = 5;

pub type TimestampMs = u64;

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Pagination {
    pub page: u64,
    pub limit: u64,
}
