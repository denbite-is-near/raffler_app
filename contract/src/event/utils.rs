use super::types::{Event, EventStatus, JsonEvent};
use crate::utils::get_random_number;
use crate::utils::{assert_condition, current_time_ms};
use near_sdk::{env, AccountId};

pub(super) fn assert_event_owner(event: &Event) {
    assert_condition(
        event.owner_id == env::predecessor_account_id(),
        "This method can be accessed only by the owner",
    );
}

pub(super) fn assert_event_status(event: &Event, status: EventStatus) {
    let event_status = get_event_status(event);

    let msg = format!("Event status isn't '{}'", &status);

    assert_condition(event_status == status, msg);
}

pub(super) fn get_event_status(event: &Event) -> EventStatus {
    if !event.is_visible {
        return EventStatus::Configuration;
    }

    let now = current_time_ms();

    // if event hasn't started yet
    if now < event.started_at {
        return EventStatus::Visible;
    }

    // if event is active now
    if event.started_at <= now && now < event.ended_at {
        return EventStatus::Active;
    }

    // event has ended, but prizes weren't raffled
    if !event.raffled {
        return EventStatus::Raffling;
    }

    return EventStatus::Claiming;
}

pub(super) fn get_random_event_participant_id(event: &Event) -> AccountId {
    // @todo change this function to produce u64 randoms
    let seed = get_random_number(0) as u64;

    assert_condition(event.participants.len() > 0, "Event has no participants");

    let random_participant_index = seed % event.participants.len();

    event
        .participants
        .as_vector()
        .get(random_participant_index)
        .unwrap()
}

pub(super) fn get_event_json(event: &Event) -> JsonEvent {
    JsonEvent {
        id: event.id.clone(),
        title: event.title.clone(),
        started_at: event.started_at,
        ended_at: event.ended_at,
        prizes: event.prizes.to_vec(),
        status: get_event_status(event),
        participants_amount: event.participants.len(),
        owner_id: event.owner_id.clone(),
    }
}

#[cfg(test)]
mod tests {
    use crate::event::types::EventStatus;
    use crate::Contract;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::testing_env;
    use near_sdk::MockedBlockchain;

    #[test]
    fn pass_assert_event_status() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context.build());

        let event_id = contract.add_event(String::from("title"), None, None);

        let event = contract.internal_get_event(&event_id);

        super::assert_event_status(&event, EventStatus::Configuration);
    }

    #[test]
    #[should_panic(expected = "Event status isn't 'Visible'")]
    fn panic_on_assert_event_status_invalid() {
        let mut contract = Contract::new();

        let mut context = VMContextBuilder::new();

        context.attached_deposit(2_000_000_000_000_000_000_000_000);
        context.predecessor_account_id("owner".try_into().unwrap());

        testing_env!(context.build());

        let event_id = contract.add_event(String::from("title"), None, None);

        let event = contract.internal_get_event(&event_id);

        super::assert_event_status(&event, EventStatus::Visible);
    }
}
