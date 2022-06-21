use crate::Contract;
use crate::ContractContract;
use crate::EventId;
use near_sdk::near_bindgen;
use near_sdk::AccountId;

use super::types::EventPrize;
use super::types::JsonEvent;

#[near_bindgen]
impl Contract {
    pub fn get_events_by_owner(&self, account_id: AccountId) -> Vec<JsonEvent> {
        Vec::new()
    }
    
    pub fn get_events_by_participant(&self, account_id: AccountId) -> Vec<JsonEvent> {
        Vec::new()
    }

    pub fn get_event(&self, event_id: EventId) -> Option<JsonEvent> {
        None
    }

    pub fn unclaimed_prizes_by_account(&self, account_id: AccountId) -> Vec<EventPrize> {
        Vec::new()
    }
}
