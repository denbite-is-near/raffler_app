use crate::types::Pagination;
use crate::types::TimestampMs;
use crate::types::DEFAULT_PAGINATION_LIMIT;
use crate::types::MAX_PAGINATION_LIMIT;
use near_sdk::env;
use near_sdk::Balance;
use near_sdk::Promise;
use near_sdk::StorageUsage;

pub fn current_time_ms() -> TimestampMs {
    env::block_timestamp() / 1_000_000
}

pub fn to_storage_key(prefix: &str) -> Vec<u8> {
    prefix.as_bytes().to_vec()
}

pub fn get_storage_cost(storage_used: StorageUsage) -> Balance {
    env::storage_byte_cost() * Balance::from(storage_used)
}

pub fn refund_deposit(storage_used: StorageUsage) {
    let storage_cost = get_storage_cost(storage_used);

    let refund = env::attached_deposit() - storage_cost;

    if refund > 1 {
        Promise::new(env::predecessor_account_id()).transfer(refund);
    }
}

pub fn assert_enough_attached_deposit(storage_used: StorageUsage) {
    let storage_cost = get_storage_cost(storage_used);

    assert_condition(
        storage_cost <= env::attached_deposit(),
        format!("Must attach {} yoctoNEAR to cover storage", storage_cost),
    );
}

pub fn assert_condition<S: AsRef<str>>(condition: bool, message: S) {
    if condition {
        return;
    }

    env::panic_str(message.as_ref());
}

/// Assert that at least 1 yoctoNEAR was attached.
pub fn assert_at_least_one_yocto() {
    assert_condition(
        env::attached_deposit() >= 1,
        "Requires attached deposit of at least 1 yoctoNEAR",
    );
}

/// Assert exactly 1 yoctoNEAR was attached.
pub fn assert_exactly_one_yocto() {
    assert_condition(
        env::attached_deposit() == 1,
        "Requires attached deposit of exactly 1 yoctoNEAR",
    );
}

pub fn unwrap_pagination(pagination: Option<Pagination>) -> (usize, usize) {
    let actual_pagination = pagination.unwrap_or(Pagination {
        page: 1,
        limit: DEFAULT_PAGINATION_LIMIT,
    });

    let actual_page = actual_pagination.page;
    let actual_limit = if actual_pagination.limit > MAX_PAGINATION_LIMIT {
        MAX_PAGINATION_LIMIT
    } else {
        actual_pagination.limit
    };

    let _skip = (actual_page - 1) * actual_limit;
    let _take = actual_limit;

    (_skip as usize, _take as usize)
}

pub fn get_random_number(shift_amount: u32) -> u32 {
    let mut seed = env::random_seed();
    let seed_len = seed.len();

    let mut arr: [u8; 4] = Default::default();

    seed.rotate_left(shift_amount as usize % seed_len);
    arr.copy_from_slice(&seed[..4]);

    u32::from_le_bytes(arr)
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;

    use near_sdk::{testing_env, MockedBlockchain};

    #[test]
    #[should_panic(expected = "panic!")]
    fn panic_on_false_assert_condition() {
        let context = VMContextBuilder::new();

        testing_env!(context.build());

        assert_condition(false, "panic!");
    }

    #[test]
    fn pass_assert_condition() {
        assert_condition(true, "panic!");
    }

    #[test]
    #[should_panic(expected = "Requires attached deposit of at least 1 yoctoNEAR")]
    fn panic_on_zero_yocto_deposit_at_least() {
        let mut context = VMContextBuilder::new();

        testing_env!(context.attached_deposit(0).build());

        assert_at_least_one_yocto();
    }

    #[test]
    #[should_panic(expected = "Requires attached deposit of exactly 1 yoctoNEAR")]
    fn panic_on_zero_yocto_deposit_exactly() {
        let mut context = VMContextBuilder::new();

        testing_env!(context.attached_deposit(0).build());

        assert_exactly_one_yocto();
    }

    #[test]
    #[should_panic(expected = "Requires attached deposit of exactly 1 yoctoNEAR")]
    fn panic_on_big_yocto_deposit_exactly() {
        let mut context = VMContextBuilder::new();

        testing_env!(context.attached_deposit(100_000).build());

        assert_exactly_one_yocto();
    }

    #[test]
    fn pass_assert_exactly_one_yocto() {
        let mut context = VMContextBuilder::new();

        testing_env!(context.attached_deposit(1).build());

        assert_exactly_one_yocto();
    }

    #[test]
    fn pass_assert_at_least_one_yocto() {
        let mut context = VMContextBuilder::new();

        testing_env!(context.attached_deposit(1).build());

        assert_at_least_one_yocto();

        testing_env!(context.attached_deposit(1_000).build());

        assert_at_least_one_yocto();

        testing_env!(context.attached_deposit(1_000_000).build());

        assert_at_least_one_yocto();

        testing_env!(context
            .attached_deposit(1_000_000_000_000_000_000_000_000)
            .build());

        assert_at_least_one_yocto();
    }

    #[test]
    fn pass_current_timestamp() {
        let mut context = VMContextBuilder::new();

        testing_env!(context.block_timestamp(5_000_000).build());
        assert_eq!(current_time_ms(), 5);

        testing_env!(context.block_timestamp(12345678).build());
        assert_eq!(current_time_ms(), 12);

        testing_env!(context.block_timestamp(1234567890).build());
        assert_eq!(current_time_ms(), 1234);

        testing_env!(context.block_timestamp(12345678901).build());
        assert_eq!(current_time_ms(), 12345);
    }
}
