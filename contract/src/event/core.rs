use crate::{Contract, ContractExt};
use near_sdk::collections::UnorderedSet;
use near_sdk::AccountId;
use near_sdk::{env, near_bindgen};

use super::types::Event;
use super::types::EventId;
use super::types::EventPrize;
use super::types::Prize;
use super::utils::get_random_event_participant_id;

#[near_bindgen]
impl Contract {
    pub(super) fn internal_get_event(&self, id: &EventId) -> Event {
        let msg = format!("Couldn't find event with id - '{}'", &id);

        let event = self.events.get(&id);

        match event {
            Option::None => env::panic_str(msg.as_str()),
            Option::Some(e) => e,
        }
    }

    pub(super) fn internal_add_event(&mut self, event: Event) {
        // insert event
        self.events.insert(&event.id, &event);

        self.next_event_id += 1;

        let owner_id = event.owner_id.clone();

        // add event to owner mapping
        let mut owner_events = self.events_by_owner.get(&owner_id).unwrap_or_else(|| {
            let mut prefix = Vec::with_capacity(34);

            prefix.extend(b"oe");
            prefix.extend(env::sha256(owner_id.as_bytes()));

            UnorderedSet::new(prefix)
        });

        owner_events.insert(&event.id);

        self.events_by_owner.insert(&owner_id, &owner_events);
    }

    pub(super) fn internal_add_event_prize(&mut self, event: &mut Event, prize: Prize) {
        // @todo make sure prize with such id doesn't exist
        event.prizes.push(&prize);

        self.events.insert(&event.id, &event);
    }

    pub(super) fn internal_join_event(&mut self, event: &mut Event, participant_id: &AccountId) {
        // @todo make sure prize with such id doesn't exist
        event.participants.insert(participant_id);

        self.events.insert(&event.id, &event);

        // add event to participant mapping
        let mut participant_events = self
            .events_by_participant
            .get(participant_id)
            .unwrap_or_else(|| {
                let mut prefix = Vec::with_capacity(34);

                prefix.extend(b"pe"); // short version of "participant events"
                prefix.extend(env::sha256(participant_id.as_bytes()));

                UnorderedSet::new(prefix)
            });

        participant_events.insert(&event.id);

        self.events_by_participant
            .insert(participant_id, &participant_events);
    }

    pub(super) fn internal_raffle_prizes(&mut self, event_id: &EventId) -> Vec<EventPrize> {
        let mut event = self.internal_get_event(event_id);

        let prizes = (0..event.prizes.len())
            .map(|prize_index| self.internal_raffle_prize(&mut event, prize_index))
            .collect();

        event.raffled = true;

        self.events.insert(&event.id, &event);

        prizes
    }

    fn internal_raffle_prize(&mut self, event: &mut Event, prize_index: u64) -> EventPrize {
        let winner_id = get_random_event_participant_id(&event);

        // update winner's account
        let mut prize = event.prizes.get(prize_index.clone()).unwrap();

        prize.winner_account_id = Some(winner_id.clone());

        event.prizes.replace(prize_index.clone(), &prize);

        let event_prize = EventPrize {
            event_id: event.id,
            prize_index: prize_index.clone(),
        };

        // add prize to unclaimed set
        let mut unclaimed_prizes = self
            .unclaimed_prizes_by_account
            .get(&winner_id.clone())
            .unwrap_or_else(|| {
                let mut prefix = Vec::with_capacity(34);

                prefix.extend(b"up"); // meaning "unclaimed prizes"
                prefix.extend(env::sha256(winner_id.clone().as_bytes()));

                UnorderedSet::new(prefix)
            });

        unclaimed_prizes.insert(&event_prize);

        self.unclaimed_prizes_by_account
            .insert(&winner_id.clone(), &unclaimed_prizes);

        event_prize
    }
}
