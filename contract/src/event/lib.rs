use crate::types::TimestampMs;
use crate::Contract;
use crate::ContractContract;
use near_sdk::near_bindgen;

use super::types::EventId;
use super::types::EventPrize;
use super::types::PrizeType;

#[near_bindgen]
impl Contract {
    pub fn add_event(
        &mut self,
        title: String,
        start_time: Option<TimestampMs>,
        end_time: Option<TimestampMs>,
    ) -> EventId {
        self.next_event_id
    }

    pub fn set_event_start_time(&mut self, event_id: EventId, time: TimestampMs) {}
    pub fn set_event_end_time(&mut self, event_id: EventId, time: TimestampMs) {}
    pub fn set_event_visible(&mut self, event_id: EventId) {}

    pub fn add_prize(&mut self, event_id: EventId, prize: PrizeType) {}

    pub fn join_event(&mut self, event_id: EventId) {}

    pub fn raffle_event_prizes(&mut self, event_id: EventId) {}

    pub fn claim_prize(&mut self, prize: EventPrize) {}
}
