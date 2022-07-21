use near_sdk::collections::{UnorderedSet, Vector};
use near_sdk::json_types::U128;
use near_sdk::{env, Balance, Promise};

use super::types::*;
use super::utils::{assert_event_owner, assert_event_status};
use crate::types::TimestampMs;
use crate::utils::*;
use crate::*;

#[near_bindgen]
impl Contract {
    #[payable]
    pub fn add_event(
        &mut self,
        title: String,
        start_time: Option<TimestampMs>,
        end_time: Option<TimestampMs>,
    ) -> EventId {
        assert_at_least_one_yocto();

        let event_id = self.next_event_id.clone();

        assert_condition(
            self.events.contains_key(&event_id) == false,
            "Couldn't add_event because event_id is already exist",
        );

        assert_condition(
            4 <= title.len() && title.len() <= 64,
            "'title' should be between 4 and 64 symbols",
        );

        assert_condition(
            (start_time.is_some() && end_time.is_some())
                || (start_time.is_none() && end_time.is_none()),
            "Both 'start_time' and 'end_time' either must be present or absent",
        );

        // in one hour by default
        let actual_start_time = start_time.unwrap_or(current_time_ms() + 3_600 * 1_000);

        // in one day by default
        let actual_end_time = end_time.unwrap_or(current_time_ms() + 24 * 3_600 * 1_000);

        assert_condition(
            actual_start_time < actual_end_time,
            "'end_time' must be bigger than 'start_time'",
        );

        assert_condition(
            current_time_ms() < actual_start_time,
            "'start_time' couldn't be set to value in the past",
        );

        let mut default_prizes_prefix = Vec::with_capacity(34);

        default_prizes_prefix.extend(b"ep"); // short version of "event prizes"
        default_prizes_prefix.extend(env::sha256(&event_id.to_be_bytes()));

        let mut default_participants_prefix = Vec::with_capacity(35);

        default_participants_prefix.extend(b"epa"); // short version of "event participants"
        default_participants_prefix.extend(env::sha256(&event_id.to_be_bytes()));

        let event = Event {
            id: event_id.clone(),
            owner_id: env::predecessor_account_id(),
            title,
            raffled: false,
            is_visible: false,
            started_at: actual_start_time,
            ended_at: actual_end_time,
            prizes: Vector::new(default_prizes_prefix),
            participants: UnorderedSet::new(default_participants_prefix),
        };

        let storage_before = env::storage_usage();

        self.internal_add_event(event);

        let storage_after = env::storage_usage();

        let storage_used = storage_after - storage_before;

        assert_enough_attached_deposit(storage_used);

        refund_deposit(storage_used);

        event_id
    }

    pub fn set_event_time(
        &mut self,
        event_id: EventId,
        start_time: TimestampMs,
        end_time: TimestampMs,
    ) {
        let mut event = self.internal_get_event(&event_id);

        assert_event_owner(&event);

        assert_event_status(&event, EventStatus::Configuration);

        assert_condition(
            start_time < end_time,
            "'end_time' must be bigger than 'start_time'",
        );

        assert_condition(
            current_time_ms() < start_time,
            "'start_time' couldn't be set to value in the past",
        );

        event.started_at = start_time;
        event.ended_at = end_time;

        self.events.insert(&event_id, &event);
    }

    pub fn set_event_visible(&mut self, event_id: EventId) {
        let mut event = self.internal_get_event(&event_id);

        assert_event_owner(&event);

        assert_event_status(&event, EventStatus::Configuration);

        assert_condition(
            event.prizes.len() >= 1,
            "Couldn't set event visible since there're no prizes",
        );

        event.is_visible = true;

        self.events.insert(&event_id, &event);
    }

    #[payable]
    pub fn add_near_prize(&mut self, event_id: EventId, amount: U128) {
        assert_at_least_one_yocto();

        let mut event = self.internal_get_event(&event_id);

        assert_event_owner(&event);

        assert_event_status(&event, EventStatus::Configuration);

        assert_condition(event.prizes.len() <= 5, "Event could have max 5 prizes");

        assert_condition(
            amount.0 >= MIN_NEAR_PRIZE_AMOUNT,
            format!(
                "Prize amount couldn't be less than {} yoctoNear",
                MIN_NEAR_PRIZE_AMOUNT
            ),
        );

        let prize = Prize {
            prize_type: PrizeType::NEAR { amount },
            winner_account_id: None,
            claimed: false,
        };

        let storage_before = env::storage_usage();

        self.internal_add_event_prize(&mut event, prize);

        let storage_after = env::storage_usage();

        let storage_cost = get_storage_cost(storage_after - storage_before);

        // storage + amount of prize
        let total_fee = storage_cost + Balance::from(amount);

        assert_condition(
            env::attached_deposit() >= total_fee,
            format!("You should attach at least {} yoctoNear", total_fee),
        );

        let refund = env::attached_deposit() - total_fee;

        if refund > 1 {
            Promise::new(env::predecessor_account_id()).transfer(refund);
        }
    }

    #[payable]
    pub fn join_event(&mut self, event_id: EventId) {
        assert_at_least_one_yocto();

        let mut event = self.internal_get_event(&event_id);

        assert_condition(
            &event.owner_id != &env::predecessor_account_id(),
            "Owner can't participate his own events",
        );

        assert_event_status(&event, EventStatus::Active);

        assert_condition(
            !event.participants.contains(&env::predecessor_account_id()),
            "You're already participating in this event",
        );

        let storage_before = env::storage_usage();

        self.internal_join_event(&mut event, &env::predecessor_account_id());

        let storage_after = env::storage_usage();

        let storage_used = storage_after - storage_before;

        assert_enough_attached_deposit(storage_used);

        refund_deposit(storage_used);
    }

    #[payable]
    pub fn raffle_event_prizes(&mut self, event_id: EventId) -> Vec<EventPrize> {
        assert_at_least_one_yocto();

        let event = self.internal_get_event(&event_id);

        assert_event_owner(&event);

        assert_event_status(&event, EventStatus::Raffling);

        let storage_before = env::storage_usage();

        let prizes = self.internal_raffle_prizes(&event.id);

        let storage_after = env::storage_usage();

        let storage_used = storage_after - storage_before;

        assert_enough_attached_deposit(storage_used);

        refund_deposit(storage_used);

        prizes
    }

    pub fn claim_prize(&mut self, prize: EventPrize) {
        let mut unclaimed_prizes = self
            .unclaimed_prizes_by_account
            .get(&env::predecessor_account_id())
            // we don't need here to build prefix because this is view method
            .unwrap_or(UnorderedSet::new(Vec::new()));

        assert_condition(
            unclaimed_prizes.contains(&prize),
            "Couldn't claim prize since it doesn't exist",
        );

        let mut event = self.internal_get_event(&prize.event_id);

        assert_event_status(&event, EventStatus::Claiming);

        assert_condition(
            prize.prize_index < event.prizes.len(),
            "Couldn't claim prize since it doesn't exist",
        );

        unclaimed_prizes.remove(&prize);

        self.unclaimed_prizes_by_account
            .insert(&env::predecessor_account_id(), &unclaimed_prizes);

        let mut actual_prize = event.prizes.get(prize.prize_index).unwrap();

        actual_prize.claimed = true;

        event.prizes.replace(prize.prize_index, &actual_prize);

        self.events.insert(&event.id, &event);

        match actual_prize.prize_type {
            PrizeType::NEAR { amount } => {
                Promise::new(env::predecessor_account_id()).transfer(amount.0)
            }
        };
    }
}

#[cfg(test)]
mod tests {
    use crate::event::types::EventPrize;

    use super::Contract;
    use near_sdk::json_types::U128;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::testing_env;
    use near_sdk::MockedBlockchain;

    const CURRENT_TIME: u64 = 1_000_000;
    const START_TIME: u64 = 2_000_000;
    const ACTIVE_TIME: u64 = 3_000_000;
    const END_TIME: u64 = 4_000_000;
    const RAFFLE_TIME: u64 = 5_000_000;
    const CLAIM_TIME: u64 = 6_000_000;

    #[test]
    fn pass_add_two_events_with_diff_ids() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context.build());
        let first_event_id = contract.add_event(String::from("title"), None, None);
        let second_event_id = contract.add_event(String::from("title"), None, None);

        // event ids should be different
        assert_eq!(first_event_id + 1, second_event_id);
    }

    #[test]
    #[should_panic(expected = "'title' should be between 4 and 64 symbols")]
    fn panic_on_add_event_with_long_title() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        // more than 64 symbols
        let big_title =
            "title_more_than_64_symbols+title_more_than_64_symbols+title_more_than_64_symbols";

        testing_env!(context.build());
        contract.add_event(String::from(big_title), None, None);
    }

    #[test]
    #[should_panic(expected = "'title' should be between 4 and 64 symbols")]
    fn panic_on_add_event_with_short_title() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        // less than 4 symbols
        let short_title = "s";

        testing_env!(context.build());
        contract.add_event(String::from(short_title), None, None);
    }

    #[test]
    fn pass_add_event() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context.build());
        contract.add_event(String::from("title"), None, None);
    }

    #[test]
    #[should_panic(expected = "'start_time' couldn't be set to value in the past")]
    fn panic_on_add_event_with_start_before_now() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context.block_timestamp(ACTIVE_TIME * 1_000_000).build());
        contract.add_event(String::from("title"), Some(START_TIME), Some(END_TIME));
    }

    #[test]
    #[should_panic(expected = "'start_time' couldn't be set to value in the past")]
    fn panic_on_set_event_time_with_start_before_now() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context.block_timestamp(ACTIVE_TIME * 1_000_000).build());
        let event_id = contract.add_event(String::from("title"), None, None);

        contract.set_event_time(event_id.clone(), START_TIME, END_TIME);
    }

    #[test]
    #[should_panic(expected = "'end_time' must be bigger than 'start_time'")]
    fn panic_on_add_event_with_end_before_start() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context.build());
        contract.add_event(String::from("title"), Some(END_TIME), Some(START_TIME));
    }

    #[test]
    #[should_panic(expected = "'end_time' must be bigger than 'start_time'")]
    fn panic_on_set_event_time_with_end_before_start() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context.build());
        let event_id = contract.add_event(String::from("title"), None, None);

        testing_env!(context.build());
        contract.set_event_time(event_id.clone(), END_TIME, START_TIME);
    }

    #[test]
    #[should_panic(expected = "Both 'start_time' and 'end_time' either must be present or absent")]
    fn panic_on_add_event_with_only_start_time() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context.build());
        contract.add_event(String::from("title"), Some(START_TIME), None);
    }

    #[test]
    #[should_panic(expected = "Both 'start_time' and 'end_time' either must be present or absent")]
    fn panic_on_add_event_with_only_end_time() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context.build());
        contract.add_event(String::from("title"), None, Some(END_TIME));
    }

    #[test]
    #[should_panic(expected = "Couldn't set event visible since there're no prizes")]
    fn panic_on_set_event_visible_without_prize() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context.build());
        let event_id = contract.add_event(String::from("title"), Some(START_TIME), Some(END_TIME));

        testing_env!(context.build());
        contract.set_event_visible(event_id.clone());
    }

    #[test]
    #[should_panic(expected = "Event status isn't 'Configuration'")]
    fn panic_on_set_event_visible_twice() {
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
        contract.set_event_visible(event_id.clone());
    }

    #[test]
    #[should_panic(expected = "This method can be accessed only by the owner")]
    fn panic_on_no_owner_accessing_event_time() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context.build());
        let event_id = contract.add_event(String::from("title"), Some(START_TIME), Some(END_TIME));

        testing_env!(context
            .predecessor_account_id("den".try_into().unwrap())
            .build());
        contract.set_event_time(event_id.clone(), START_TIME, END_TIME);
    }

    #[test]
    #[should_panic(expected = "This method can be accessed only by the owner")]
    fn panic_on_no_owner_accessing_event_visibity() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context.build());
        let event_id = contract.add_event(String::from("title"), Some(START_TIME), Some(END_TIME));

        testing_env!(context.build());
        contract.add_near_prize(event_id.clone(), U128(1_000_000_000_000_000_000_000_000));

        testing_env!(context
            .predecessor_account_id("den".try_into().unwrap())
            .build());
        contract.set_event_visible(event_id.clone());
    }

    #[test]
    #[should_panic(expected = "This method can be accessed only by the owner")]
    fn panic_on_no_owner_accessing_event_prizes() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context.build());
        let event_id = contract.add_event(String::from("title"), Some(START_TIME), Some(END_TIME));

        testing_env!(context
            .predecessor_account_id("den".try_into().unwrap())
            .build());
        contract.add_near_prize(event_id.clone(), U128(1_000_000_000_000_000_000_000_000));
    }

    #[test]
    #[should_panic(expected = "This method can be accessed only by the owner")]
    fn panic_on_no_owner_accessing_raffle_event_prizes() {
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
            .predecessor_account_id("den".try_into().unwrap())
            .block_timestamp(RAFFLE_TIME * 1_000_000)
            .build());
        contract.raffle_event_prizes(event_id.clone());
    }

    #[test]
    fn pass_owner_set_event_visible() {
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
    }

    #[test]
    #[should_panic(expected = "Event status isn't 'Configuration'")]
    fn panic_on_set_event_time_after_event_visible() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        context.block_timestamp(CURRENT_TIME * 1_000_000);

        testing_env!(context.build());
        let event_id = contract.add_event(String::from("title"), None, None);

        println!("event_id: {}", event_id);
        let event = contract.get_event(event_id.clone()).unwrap();
        println!("event_before_near_prize: {:?}", event);
        contract.add_near_prize(event_id.clone(), U128(1_000_000_000_000_000_000_000_000));
        let event = contract.get_event(event_id.clone()).unwrap();
        println!("event_after_near_prize: {:?}", event);
        contract.set_event_visible(event_id.clone());

        let event = contract.get_event(event_id.clone()).unwrap();
        println!("event_after_event_visible: {:?}", event);
        contract.set_event_time(event_id.clone(), START_TIME, END_TIME);
        let event = contract.get_event(event_id.clone()).unwrap();
        println!("event_after_event_time: {:?}", event);
    }

    #[test]
    #[should_panic(
        expected = "Prize amount couldn't be less than 100000000000000000000000 yoctoNear"
    )]
    fn panic_on_adding_small_near_prize_for_event() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context.build());
        let event_id = contract.add_event(String::from("title"), Some(START_TIME), Some(END_TIME));

        testing_env!(context.build());
        contract.add_near_prize(event_id.clone(), U128(1_000_000));
    }

    #[test]
    fn pass_adding_event_near_prize() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context.build());
        let event_id = contract.add_event(String::from("title"), Some(START_TIME), Some(END_TIME));

        testing_env!(context.build());
        contract.add_near_prize(event_id.clone(), U128(100_000_000_000_000_000_000_000));
    }

    #[test]
    #[should_panic(expected = "Event status isn't 'Configuration'")]
    fn panic_on_adding_near_prize_for_visible_event() {
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

        testing_env!(context.block_timestamp(CURRENT_TIME * 1_000_000).build());
        contract.add_near_prize(event_id.clone(), U128(1_000_000_000_000_000_000_000_000));
    }

    #[test]
    #[should_panic(expected = "Event status isn't 'Active'")]
    fn panic_on_joining_event_before_start() {
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
            .predecessor_account_id("den".try_into().unwrap())
            .block_timestamp((START_TIME - 1_000_000) * 1_000_000)
            .build());
        contract.join_event(event_id.clone());
    }

    #[test]
    #[should_panic(expected = "Event status isn't 'Active'")]
    fn panic_on_joining_event_after_end() {
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
            .predecessor_account_id("den".try_into().unwrap())
            .block_timestamp((END_TIME + 1_000_000) * 1_000_000)
            .build());
        contract.join_event(event_id.clone());
    }

    #[test]
    #[should_panic(expected = "You're already participating in this event")]
    fn panic_on_multiple_joining_event() {
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
        contract.join_event(event_id.clone());
    }

    #[test]
    #[should_panic(expected = "Owner can't participate his own events")]
    fn panic_on_joining_owned_event() {
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

        context.block_timestamp(ACTIVE_TIME * 1_000_000);

        testing_env!(context.build());
        contract.join_event(event_id.clone());
    }

    #[test]
    fn pass_join_event() {
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

        context.block_timestamp(ACTIVE_TIME * 1_000_000);

        testing_env!(context
            .predecessor_account_id("den".try_into().unwrap())
            .build());
        contract.join_event(event_id.clone());
    }

    #[test]
    fn pass_raffle_event_prizes_for_multiple_participants() {
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

        context.block_timestamp(ACTIVE_TIME * 1_000_000);

        testing_env!(context
            .predecessor_account_id("den".try_into().unwrap())
            .build());
        contract.join_event(event_id.clone());

        testing_env!(context
            .predecessor_account_id("den2".try_into().unwrap())
            .build());
        contract.join_event(event_id.clone());
        testing_env!(context
            .predecessor_account_id("den3".try_into().unwrap())
            .build());
        contract.join_event(event_id.clone());

        testing_env!(context
            .predecessor_account_id("owner".try_into().unwrap())
            .block_timestamp(RAFFLE_TIME * 1_000_000)
            .build());
        let prizes = contract.raffle_event_prizes(event_id.clone());

        assert!(prizes.len() == 1);
    }
    #[test]
    fn pass_raffle_event_prizes() {
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

        context.block_timestamp(ACTIVE_TIME * 1_000_000);

        testing_env!(context
            .predecessor_account_id("den".try_into().unwrap())
            .build());
        contract.join_event(event_id.clone());

        testing_env!(context
            .predecessor_account_id("owner".try_into().unwrap())
            .block_timestamp(RAFFLE_TIME * 1_000_000)
            .build());
        let prizes = contract.raffle_event_prizes(event_id.clone());

        assert!(prizes.len() == 1);

        let json_event = contract.get_event(event_id).unwrap();

        let internal_prize = json_event.prizes.get(0).unwrap();

        assert_eq!(internal_prize.claimed, false);
        assert_eq!(internal_prize.winner_account_id, Some("den".to_string()));
    }

    #[test]
    #[should_panic(expected = "Event has no participants")]
    fn panic_on_raffle_event_prizes_without_participants() {
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
            .predecessor_account_id("owner".try_into().unwrap())
            .block_timestamp(RAFFLE_TIME * 1_000_000)
            .build());
        contract.raffle_event_prizes(event_id.clone());
    }

    #[test]
    fn pass_claim_event_prize() {
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

        context.block_timestamp(ACTIVE_TIME * 1_000_000);

        testing_env!(context
            .predecessor_account_id("den".try_into().unwrap())
            .build());
        contract.join_event(event_id.clone());

        testing_env!(context
            .predecessor_account_id("owner".try_into().unwrap())
            .block_timestamp(RAFFLE_TIME * 1_000_000)
            .build());
        let prizes = contract.raffle_event_prizes(event_id.clone());

        let den_prize = prizes.get(0).unwrap().clone();

        testing_env!(context
            .predecessor_account_id("den".try_into().unwrap())
            .block_timestamp(CLAIM_TIME * 1_000_000)
            .build());

        let unclaimed = contract.get_account_unclaimed_prizes("den".to_string(), None);
        assert_eq!(unclaimed.len(), 1);

        contract.claim_prize(den_prize.clone());

        let unclaimed = contract.get_account_unclaimed_prizes("den".to_string(), None);
        assert_eq!(unclaimed.len(), 0);

        let json_event = contract.get_event(event_id).unwrap();

        let internal_prize = json_event
            .prizes
            .get(den_prize.prize_index as usize)
            .unwrap();

        assert_eq!(internal_prize.claimed, true);
        assert_eq!(
            internal_prize.winner_account_id.as_deref(),
            Some("den".to_string()).as_deref()
        );
    }

    #[test]
    #[should_panic(expected = "Couldn't claim prize since it doesn't exist")]
    fn panic_on_claiming_another_event_prize() {
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

        context.block_timestamp(ACTIVE_TIME * 1_000_000);

        testing_env!(context
            .predecessor_account_id("den".try_into().unwrap())
            .build());
        contract.join_event(event_id.clone());

        testing_env!(context
            .predecessor_account_id("owner".try_into().unwrap())
            .block_timestamp(RAFFLE_TIME * 1_000_000)
            .build());
        let prizes = contract.raffle_event_prizes(event_id.clone());

        let den_prize = prizes.get(0).unwrap().clone();

        testing_env!(context
            .predecessor_account_id("another_den".try_into().unwrap())
            .block_timestamp(CLAIM_TIME * 1_000_000)
            .build());

        contract.claim_prize(den_prize);
    }

    #[test]
    #[should_panic(expected = "Couldn't claim prize since it doesn't exist")]
    fn panic_on_claiming_non_existed_event_prize() {
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

        context.block_timestamp(ACTIVE_TIME * 1_000_000);

        testing_env!(context
            .predecessor_account_id("den".try_into().unwrap())
            .build());
        contract.join_event(event_id.clone());

        testing_env!(context
            .predecessor_account_id("owner".try_into().unwrap())
            .block_timestamp(RAFFLE_TIME * 1_000_000)
            .build());
        contract.raffle_event_prizes(event_id.clone());

        let non_existed_prize = EventPrize {
            event_id: 14241241421,
            prize_index: 4214124,
        };

        testing_env!(context
            .predecessor_account_id("den".try_into().unwrap())
            .block_timestamp(CLAIM_TIME * 1_000_000)
            .build());

        contract.claim_prize(non_existed_prize);
    }
}
