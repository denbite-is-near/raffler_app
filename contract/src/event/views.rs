use crate::types::Pagination;
use crate::utils::unwrap_pagination;
use crate::*;
use near_sdk::collections::UnorderedSet;
use near_sdk::AccountId;

use super::types::{EventId, EventPrize, JsonEvent};
use super::utils::get_event_json;

#[near_bindgen]
impl Contract {
    pub fn get_owner_events(
        &self,
        account_id: AccountId,
        pagination: Option<Pagination>,
    ) -> Vec<JsonEvent> {
        let event_ids = self
            .events_by_owner
            .get(&account_id)
            // we don't need here build prefix because this is view method
            .unwrap_or(UnorderedSet::new(Vec::new()));

        let (_skip, _take) = unwrap_pagination(pagination);

        event_ids
            .iter()
            .skip(_skip)
            .take(_take)
            .filter_map(|event_id| self.events.get(&event_id))
            .map(|e| get_event_json(&e))
            .collect::<Vec<JsonEvent>>()
    }

    pub fn get_participant_events(
        &self,
        account_id: AccountId,
        pagination: Option<Pagination>,
    ) -> Vec<JsonEvent> {
        let event_ids = self
            .events_by_participant
            .get(&account_id)
            // we don't need here build prefix because this is view method
            .unwrap_or(UnorderedSet::new(Vec::new()));

        let (_skip, _take) = unwrap_pagination(pagination);

        event_ids
            .iter()
            .skip(_skip)
            .take(_take)
            .filter_map(|event_id| self.events.get(&event_id))
            .map(|e| get_event_json(&e))
            .collect::<Vec<JsonEvent>>()
    }

    pub fn get_event(&self, event_id: EventId) -> Option<JsonEvent> {
        let event = self.events.get(&event_id);

        match event {
            Some(e) => Some(get_event_json(&e)),
            None => None,
        }
    }

    pub fn get_account_unclaimed_prizes(
        &self,
        account_id: AccountId,
        pagination: Option<Pagination>,
    ) -> Vec<EventPrize> {
        let prizes = self
            .unclaimed_prizes_by_account
            .get(&account_id)
            // we don't need here to build prefix because this is view method
            .unwrap_or(UnorderedSet::new(Vec::new()));

        let (_skip, _take) = unwrap_pagination(pagination);

        prizes
            .iter()
            .skip(_skip)
            .take(_take)
            .collect::<Vec<EventPrize>>()
    }

    pub fn is_user_joined_event(&self, account_id: AccountId, event_id: EventId) -> bool {
        let wrapped_joined_events = self.events_by_participant.get(&account_id);

        let joined_events = match wrapped_joined_events {
            Some(e) => e,
            None => return false,
        };

        joined_events.contains(&event_id)
    }
}

#[cfg(test)]
mod tests {
    use near_sdk::test_utils::VMContextBuilder;

    use crate::types::Pagination;

    use super::Contract;

    use near_sdk::json_types::U128;
    use near_sdk::{testing_env, MockedBlockchain};

    const CURRENT_TIME: u64 = 1_000_000;
    const START_TIME: u64 = 2_000_000;
    const ACTIVE_TIME: u64 = 3_000_000;
    const END_TIME: u64 = 4_000_000;
    const RAFFLE_TIME: u64 = 5_000_000;
    const CLAIM_TIME: u64 = 6_000_000;

    #[test]
    fn pass_get_owner_events() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context.build());
        let events = contract.get_owner_events("owner".to_string(), None);
        // he should has one event
        assert_eq!(events.len(), 0);

        let event_id = contract.add_event(String::from("title"), None, None);

        context.is_view(true);
        testing_env!(context.build());
        let events = contract.get_owner_events("owner".to_string(), None);

        // should has one event
        assert_eq!(events.len(), 1);

        let event = &events[0];

        // the same event_id as we created
        assert_eq!(event.id.clone(), event_id.clone());

        let events = contract.get_owner_events("no_owner".to_string(), None);
        // should has no events
        assert_eq!(events.len(), 0);
    }

    #[test]
    fn pass_get_owner_events_pagination() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);

        // create 9 different events
        for _ in 0..9 {
            testing_env!(context
                .block_timestamp(CURRENT_TIME * 1_000_000)
                .predecessor_account_id("owner".try_into().unwrap())
                .build());

            contract.add_event(String::from("title"), Some(START_TIME), Some(END_TIME));
        }

        let events = contract.get_owner_events("owner".to_string(), None);
        assert_eq!(events.len(), 5);

        let events =
            contract.get_owner_events("owner".to_string(), Some(Pagination { page: 1, limit: 5 }));
        assert_eq!(events.len(), 5);

        let events =
            contract.get_owner_events("owner".to_string(), Some(Pagination { page: 2, limit: 5 }));
        assert_eq!(events.len(), 4);
        let events =
            contract.get_owner_events("owner".to_string(), Some(Pagination { page: 3, limit: 5 }));
        assert_eq!(events.len(), 0);

        // couldn't return more than 5 per request
        let events =
            contract.get_owner_events("owner".to_string(), Some(Pagination { page: 1, limit: 25 }));
        assert_eq!(events.len(), 5);
    }

    #[test]
    fn pass_get_participant_events() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context.build());
        let event_id = contract.add_event(String::from("title"), Some(START_TIME), Some(END_TIME));

        testing_env!(context.build());
        contract.add_near_prize(event_id.clone(), U128(1_000_000_000_000_000_000_000_000));

        testing_env!(context.build());
        contract.set_event_visible(event_id.clone());

        let participation_events = contract.get_participant_events("den".to_string(), None);
        assert_eq!(participation_events.len(), 0);

        testing_env!(context
            .block_timestamp(ACTIVE_TIME * 1_000_000)
            .predecessor_account_id("den".try_into().unwrap())
            .build());
        contract.join_event(event_id.clone());

        context.is_view(true);

        let participation_events = contract.get_participant_events("den".to_string(), None);
        assert_eq!(participation_events.len(), 1);

        let participation_events = contract.get_participant_events("den2".to_string(), None);
        assert_eq!(participation_events.len(), 0);
    }

    #[test]
    fn pass_get_participant_events_pagination() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);

        for _ in 0..9 {
            testing_env!(context
                .block_timestamp(CURRENT_TIME * 1_000_000)
                .predecessor_account_id("owner".try_into().unwrap())
                .build());
            let event_id =
                contract.add_event(String::from("title"), Some(START_TIME), Some(END_TIME));

            testing_env!(context.build());
            contract.add_near_prize(event_id.clone(), U128(1_000_000_000_000_000_000_000_000));

            testing_env!(context.build());
            contract.set_event_visible(event_id.clone());

            testing_env!(context
                .block_timestamp(ACTIVE_TIME * 1_000_000)
                .predecessor_account_id("den".try_into().unwrap())
                .build());
            contract.join_event(event_id.clone());
        }

        testing_env!(context.block_timestamp(RAFFLE_TIME * 1_000_000).build());

        context.is_view(true);

        let participation_events = contract
            .get_participant_events("den".to_string(), Some(Pagination { page: 1, limit: 5 }));
        assert_eq!(participation_events.len(), 5);

        let participation_events = contract
            .get_participant_events("den".to_string(), Some(Pagination { page: 2, limit: 5 }));
        assert_eq!(participation_events.len(), 4);

        let participation_events = contract
            .get_participant_events("den".to_string(), Some(Pagination { page: 3, limit: 5 }));
        assert_eq!(participation_events.len(), 0);

        let participation_events = contract
            .get_participant_events("den".to_string(), Some(Pagination { page: 1, limit: 25 }));
        assert_eq!(participation_events.len(), 5);
    }

    #[test]
    fn pass_get_account_unclaimed_prizes() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context.build());
        let event_id = contract.add_event(String::from("title"), Some(START_TIME), Some(END_TIME));

        testing_env!(context.build());
        contract.add_near_prize(event_id.clone(), U128(1_000_000_000_000_000_000_000_000));

        testing_env!(context.build());
        contract.set_event_visible(event_id.clone());

        testing_env!(context
            .block_timestamp(ACTIVE_TIME * 1_000_000)
            .predecessor_account_id("den".try_into().unwrap())
            .build());
        contract.join_event(event_id.clone());

        let prizes = contract.get_account_unclaimed_prizes("den".to_string(), None);
        assert_eq!(prizes.len(), 0);

        testing_env!(context
            .predecessor_account_id("owner".try_into().unwrap())
            .block_timestamp(RAFFLE_TIME * 1_000_000)
            .build());
        contract.raffle_event_prizes(event_id.clone());

        context.is_view(true);

        testing_env!(context.block_timestamp(CLAIM_TIME * 1_000_000).build());

        let prizes = contract.get_account_unclaimed_prizes("den".to_string(), None);
        assert_eq!(prizes.len(), 1);

        let prizes = contract.get_account_unclaimed_prizes("owner".to_string(), None);
        assert_eq!(prizes.len(), 0);
    }

    #[test]
    fn pass_get_account_unclaimed_prizes_pagination() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);

        for _ in 0..9 {
            testing_env!(context
                .block_timestamp(CURRENT_TIME * 1_000_000)
                .predecessor_account_id("owner".try_into().unwrap())
                .build());
            let event_id =
                contract.add_event(String::from("title"), Some(START_TIME), Some(END_TIME));

            testing_env!(context.build());
            contract.add_near_prize(event_id.clone(), U128(1_000_000_000_000_000_000_000_000));

            testing_env!(context.build());
            contract.set_event_visible(event_id.clone());

            testing_env!(context
                .block_timestamp(ACTIVE_TIME * 1_000_000)
                .predecessor_account_id("den".try_into().unwrap())
                .build());
            contract.join_event(event_id.clone());

            testing_env!(context
                .predecessor_account_id("owner".try_into().unwrap())
                .block_timestamp(RAFFLE_TIME * 1_000_000)
                .build());
            contract.raffle_event_prizes(event_id.clone());
        }

        testing_env!(context.block_timestamp(CLAIM_TIME * 1_000_000).build());

        context.is_view(true);

        let prizes = contract.get_account_unclaimed_prizes(
            "den".to_string(),
            Some(Pagination { page: 1, limit: 5 }),
        );
        assert_eq!(prizes.len(), 5);

        let prizes = contract.get_account_unclaimed_prizes(
            "den".to_string(),
            Some(Pagination { page: 2, limit: 5 }),
        );
        assert_eq!(prizes.len(), 4);

        let prizes = contract.get_account_unclaimed_prizes(
            "den".to_string(),
            Some(Pagination { page: 3, limit: 5 }),
        );
        assert_eq!(prizes.len(), 0);

        let prizes = contract.get_account_unclaimed_prizes(
            "den".to_string(),
            Some(Pagination { page: 1, limit: 25 }),
        );
        assert_eq!(prizes.len(), 5);
    }

    #[test]
    fn pass_get_event_by_anyone() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context
            .attached_deposit(1_000_000_000_000_000_000_000_000)
            .build());
        let event_id = contract.add_event(String::from("title"), None, None);
        context.is_view(true);

        testing_env!(context
            .predecessor_account_id("den".try_into().unwrap())
            .build());
        let event = contract.get_event(event_id);
        assert!(event.is_some(), "Event doesn't exist");
    }

    #[test]
    fn pass_get_event_by_owner() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context
            .attached_deposit(1_000_000_000_000_000_000_000_000)
            .build());
        let event_id = contract.add_event(String::from("title"), None, None);
        context.is_view(true);

        testing_env!(context.build());
        let event = contract.get_event(event_id);
        assert!(event.is_some(), "Event doesn't exist");
    }
}
