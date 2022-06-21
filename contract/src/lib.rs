use event::types::{Event, EventId, EventPrize};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedSet};
use near_sdk::{near_bindgen, AccountId, PanicOnDefault};
use utils::to_storage_key;

// import modules
mod event;
mod types;
mod utils;

near_sdk::setup_alloc!();

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    next_event_id: EventId,
    events: LookupMap<EventId, Event>,
    events_by_owner: LookupMap<AccountId, UnorderedSet<EventId>>,
    events_by_participant: LookupMap<AccountId, UnorderedSet<EventId>>,
    unclaimed_prizes_by_account: LookupMap<AccountId, UnorderedSet<EventPrize>>,
}

#[near_bindgen]
impl Contract {
    pub fn new() -> Self {
        Self {
            next_event_id: 1,
            events: LookupMap::new(to_storage_key("e")),
            events_by_owner: LookupMap::new(to_storage_key("eo")),
            events_by_participant: LookupMap::new(to_storage_key("ep")),
            unclaimed_prizes_by_account: LookupMap::new(to_storage_key("upa")),
        }
    }
}

#[cfg(test)]
mod tests {}
