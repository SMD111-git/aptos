#[test_only]
module skill_passport_addr::skill_passport_test {
    use skill_passport_addr::skill_passport;
    use std::string;
    use aptos_framework::account;
    use aptos_framework::timestamp;

    #[test(admin = @skill_passport_addr)]
    public fun test_initialize(admin: &signer) {
        // Setup
        timestamp::set_time_has_started_for_testing(&account::create_account_for_test(@0x1));
        
        // Initialize
        skill_passport::initialize(admin);
        
        // Verify - no errors means success
    }

    #[test(admin = @skill_passport_addr, verifier = @0x123)]
    public fun test_add_verifier(admin: &signer, verifier: &signer) {
        // Setup
        timestamp::set_time_has_started_for_testing(&account::create_account_for_test(@0x1));
        let verifier_addr = signer::address_of(verifier);
        
        // Initialize
        skill_passport::initialize(admin);
        
        // Add verifier
        skill_passport::add_verifier(admin, verifier_addr, signer::address_of(admin));
        
        // Verify
        assert!(skill_passport::is_verifier(signer::address_of(admin), verifier_addr), 1);
    }

    #[test(admin = @skill_passport_addr, verifier = @0x123, student = @0x456)]
    public fun test_mint_verified_badge(admin: &signer, verifier: &signer, student: &signer) {
        // Setup
        timestamp::set_time_has_started_for_testing(&account::create_account_for_test(@0x1));
        let verifier_addr = signer::address_of(verifier);
        let student_addr = signer::address_of(student);
        let admin_addr = signer::address_of(admin);
        
        // Initialize and add verifier
        skill_passport::initialize(admin);
        skill_passport::add_verifier(admin, verifier_addr, admin_addr);
        
        // Mint badge
        skill_passport::mint_verified_badge(
            verifier,
            admin_addr,
            student_addr,
            string::utf8(b"Solidity"),
            string::utf8(b"Advanced"),
            string::utf8(b"Ethereum Foundation"),
            0,
            string::utf8(b"ipfs://QmTest"),
        );
        
        // Verify
        let badges = skill_passport::get_badges_by_owner(admin_addr, student_addr);
        assert!(vector::length(&badges) == 1, 2);
    }
}
