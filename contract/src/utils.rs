use crate::types::TimestampMs;
use near_sdk::env;

pub fn current_time_ms() -> TimestampMs {
    env::block_timestamp() / 1_000_000
}

pub fn to_storage_key(prefix: &str) -> Vec<u8> {
    prefix.as_bytes().to_vec()
}
