module skill_passport_addr::skill_passport {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::timestamp;

    // =================== Error Codes ===================
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_NOT_AUTHORIZED: u64 = 3;
    const E_INVALID_BADGE_DATA: u64 = 4;
    const E_BADGE_NOT_FOUND: u64 = 5;
    const E_NOT_ADMIN: u64 = 6;
    const E_INVALID_EXPIRY: u64 = 7;

    // =================== Structs ===================
    
    /// Badge NFT with comprehensive metadata
    struct Badge has copy, drop, store {
        id: u64,
        owner: address,
        skill: String,
        level: String,
        issuer: address,
        issuer_name: String,
        date_issued: u64,
        expiry_date: u64,  // 0 means no expiry
        verified: bool,
        metadata_uri: String,  // IPFS or Arweave URI
    }

    /// Events emitted by the contract
    struct BadgeMintedEvent has drop, store {
        badge_id: u64,
        owner: address,
        issuer: address,
        skill: String,
        verified: bool,
        timestamp: u64,
    }

    struct BadgeRevokedEvent has drop, store {
        badge_id: u64,
        owner: address,
        issuer: address,
        reason: String,
        timestamp: u64,
    }

    struct VerifierAddedEvent has drop, store {
        verifier: address,
        added_by: address,
        timestamp: u64,
    }

    struct VerifierRemovedEvent has drop, store {
        verifier: address,
        removed_by: address,
        timestamp: u64,
    }

    /// Global badge registry stored at contract deployer address
    struct BadgeRegistry has key {
        badges: vector<Badge>,
        counter: u64,
        mint_events: EventHandle<BadgeMintedEvent>,
        revoke_events: EventHandle<BadgeRevokedEvent>,
    }

    /// Verifier registry with role-based access control
    struct VerifierRegistry has key {
        admin: address,
        verifiers: vector<address>,
        verifier_added_events: EventHandle<VerifierAddedEvent>,
        verifier_removed_events: EventHandle<VerifierRemovedEvent>,
    }

    // =================== Initialization ===================
    
    /// Initialize the contract - call once after deployment
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        // Ensure not already initialized
        assert!(!exists<BadgeRegistry>(admin_addr), E_ALREADY_INITIALIZED);
        assert!(!exists<VerifierRegistry>(admin_addr), E_ALREADY_INITIALIZED);

        // Create badge registry
        move_to(admin, BadgeRegistry {
            badges: vector::empty<Badge>(),
            counter: 1,
            mint_events: account::new_event_handle<BadgeMintedEvent>(admin),
            revoke_events: account::new_event_handle<BadgeRevokedEvent>(admin),
        });

        // Create verifier registry with admin as first verifier
        let mut initial_verifiers = vector::empty<address>();
        vector::push_back(&mut initial_verifiers, admin_addr);

        move_to(admin, VerifierRegistry {
            admin: admin_addr,
            verifiers: initial_verifiers,
            verifier_added_events: account::new_event_handle<VerifierAddedEvent>(admin),
            verifier_removed_events: account::new_event_handle<VerifierRemovedEvent>(admin),
        });
    }

    // =================== Admin Functions ===================
    
    /// Add a new verifier (admin only)
    public entry fun add_verifier(
        admin: &signer,
        verifier: address,
        registry_addr: address
    ) acquires VerifierRegistry {
        assert!(exists<VerifierRegistry>(registry_addr), E_NOT_INITIALIZED);
        
        let registry = borrow_global_mut<VerifierRegistry>(registry_addr);
        let admin_addr = signer::address_of(admin);
        
        // Check admin authorization
        assert!(admin_addr == registry.admin, E_NOT_ADMIN);
        
        // Add verifier if not already present
        if (!vector_contains(&registry.verifiers, &verifier)) {
            vector::push_back(&mut registry.verifiers, verifier);
            
            event::emit_event(&mut registry.verifier_added_events, VerifierAddedEvent {
                verifier,
                added_by: admin_addr,
                timestamp: timestamp::now_seconds(),
            });
        };
    }

    /// Remove a verifier (admin only)
    public entry fun remove_verifier(
        admin: &signer,
        verifier: address,
        registry_addr: address
    ) acquires VerifierRegistry {
        assert!(exists<VerifierRegistry>(registry_addr), E_NOT_INITIALIZED);
        
        let registry = borrow_global_mut<VerifierRegistry>(registry_addr);
        let admin_addr = signer::address_of(admin);
        
        assert!(admin_addr == registry.admin, E_NOT_ADMIN);
        
        // Remove verifier if present
        let (found, index) = vector_index_of(&registry.verifiers, &verifier);
        if (found) {
            vector::remove(&mut registry.verifiers, index);
            
            event::emit_event(&mut registry.verifier_removed_events, VerifierRemovedEvent {
                verifier,
                removed_by: admin_addr,
                timestamp: timestamp::now_seconds(),
            });
        };
    }

    // =================== Badge Minting ===================
    
    /// Mint a verified badge (verifiers only)
    public entry fun mint_verified_badge(
        verifier: &signer,
        registry_addr: address,
        recipient: address,
        skill: vector<u8>,
        level: vector<u8>,
        issuer_name: vector<u8>,
        expiry_date: u64,
        metadata_uri: vector<u8>,
    ) acquires VerifierRegistry, BadgeRegistry {
        let verifier_addr = signer::address_of(verifier);
        
        // Verify authorization
        assert!(exists<VerifierRegistry>(registry_addr), E_NOT_INITIALIZED);
        let registry = borrow_global<VerifierRegistry>(registry_addr);
        assert!(vector_contains(&registry.verifiers, &verifier_addr), E_NOT_AUTHORIZED);
        
        // Validate inputs
        assert!(vector::length(&skill) > 0, E_INVALID_BADGE_DATA);
        assert!(vector::length(&level) > 0, E_INVALID_BADGE_DATA);
        
        // Validate expiry (if set, must be in future)
        if (expiry_date > 0) {
            assert!(expiry_date > timestamp::now_seconds(), E_INVALID_EXPIRY);
        };
        
        // Mint badge
        assert!(exists<BadgeRegistry>(registry_addr), E_NOT_INITIALIZED);
        let badge_store = borrow_global_mut<BadgeRegistry>(registry_addr);
        
        let badge_id = badge_store.counter;
        badge_store.counter = badge_id + 1;
        
        let skill_str = string::utf8(skill);
        let badge = Badge {
            id: badge_id,
            owner: recipient,
            skill: skill_str,
            level: string::utf8(level),
            issuer: verifier_addr,
            issuer_name: string::utf8(issuer_name),
            date_issued: timestamp::now_seconds(),
            expiry_date,
            verified: true,
            metadata_uri: string::utf8(metadata_uri),
        };
        
        vector::push_back(&mut badge_store.badges, badge);
        
        event::emit_event(&mut badge_store.mint_events, BadgeMintedEvent {
            badge_id,
            owner: recipient,
            issuer: verifier_addr,
            skill: skill_str,
            verified: true,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Mint a self-claimed badge (unverified)
    public entry fun mint_self_badge(
        user: &signer,
        registry_addr: address,
        skill: vector<u8>,
        level: vector<u8>,
        issuer_name: vector<u8>,
        metadata_uri: vector<u8>,
    ) acquires BadgeRegistry {
        let user_addr = signer::address_of(user);
        
        // Validate inputs
        assert!(vector::length(&skill) > 0, E_INVALID_BADGE_DATA);
        assert!(exists<BadgeRegistry>(registry_addr), E_NOT_INITIALIZED);
        
        let badge_store = borrow_global_mut<BadgeRegistry>(registry_addr);
        let badge_id = badge_store.counter;
        badge_store.counter = badge_id + 1;
        
        let skill_str = string::utf8(skill);
        let badge = Badge {
            id: badge_id,
            owner: user_addr,
            skill: skill_str,
            level: string::utf8(level),
            issuer: user_addr,
            issuer_name: string::utf8(issuer_name),
            date_issued: timestamp::now_seconds(),
            expiry_date: 0,
            verified: false,
            metadata_uri: string::utf8(metadata_uri),
        };
        
        vector::push_back(&mut badge_store.badges, badge);
        
        event::emit_event(&mut badge_store.mint_events, BadgeMintedEvent {
            badge_id,
            owner: user_addr,
            issuer: user_addr,
            skill: skill_str,
            verified: false,
            timestamp: timestamp::now_seconds(),
        });
    }

    // =================== Badge Management ===================
    
    /// Revoke a badge (issuer or admin only)
    public entry fun revoke_badge(
        caller: &signer,
        registry_addr: address,
        badge_id: u64,
        reason: vector<u8>,
    ) acquires BadgeRegistry, VerifierRegistry {
        let caller_addr = signer::address_of(caller);
        
        assert!(exists<BadgeRegistry>(registry_addr), E_NOT_INITIALIZED);
        let badge_store = borrow_global_mut<BadgeRegistry>(registry_addr);
        
        // Find and verify authorization
        let len = vector::length(&badge_store.badges);
        let mut i = 0;
        let mut found = false;
        let mut badge_owner = @0x0;
        let mut badge_issuer = @0x0;
        
        while (i < len) {
            let badge = vector::borrow(&badge_store.badges, i);
            if (badge.id == badge_id) {
                badge_owner = badge.owner;
                badge_issuer = badge.issuer;
                found = true;
                
                // Check if caller is issuer or admin
                let is_issuer = caller_addr == badge_issuer;
                let is_admin = if (exists<VerifierRegistry>(registry_addr)) {
                    let reg = borrow_global<VerifierRegistry>(registry_addr);
                    caller_addr == reg.admin
                } else {
                    false
                };
                
                assert!(is_issuer || is_admin, E_NOT_AUTHORIZED);
                
                // Remove badge
                vector::remove(&mut badge_store.badges, i);
                break
            };
            i = i + 1;
        };
        
        assert!(found, E_BADGE_NOT_FOUND);
        
        event::emit_event(&mut badge_store.revoke_events, BadgeRevokedEvent {
            badge_id,
            owner: badge_owner,
            issuer: badge_issuer,
            reason: string::utf8(reason),
            timestamp: timestamp::now_seconds(),
        });
    }

    // =================== View Functions ===================
    
    /// Get all badges owned by an address
    #[view]
    public fun get_badges_by_owner(registry_addr: address, owner: address): vector<Badge> acquires BadgeRegistry {
        if (!exists<BadgeRegistry>(registry_addr)) {
            return vector::empty<Badge>()
        };
        
        let badge_store = borrow_global<BadgeRegistry>(registry_addr);
        let result = vector::empty<Badge>();
        let len = vector::length(&badge_store.badges);
        let mut i = 0;
        
        while (i < len) {
            let badge = vector::borrow(&badge_store.badges, i);
            if (badge.owner == owner) {
                vector::push_back(&mut result, *badge);
            };
            i = i + 1;
        };
        
        result
    }

    /// Get badge by ID
    #[view]
    public fun get_badge_by_id(registry_addr: address, badge_id: u64): Badge acquires BadgeRegistry {
        assert!(exists<BadgeRegistry>(registry_addr), E_NOT_INITIALIZED);
        
        let badge_store = borrow_global<BadgeRegistry>(registry_addr);
        let len = vector::length(&badge_store.badges);
        let mut i = 0;
        
        while (i < len) {
            let badge = vector::borrow(&badge_store.badges, i);
            if (badge.id == badge_id) {
                return *badge
            };
            i = i + 1;
        };
        
        // Return empty badge if not found (caller should check id)
        abort E_BADGE_NOT_FOUND
    }

    /// Check if an address is a registered verifier
    #[view]
    public fun is_verifier(registry_addr: address, addr: address): bool acquires VerifierRegistry {
        if (!exists<VerifierRegistry>(registry_addr)) {
            return false
        };
        
        let registry = borrow_global<VerifierRegistry>(registry_addr);
        vector_contains(&registry.verifiers, &addr)
    }

    /// Get all verifiers
    #[view]
    public fun get_all_verifiers(registry_addr: address): vector<address> acquires VerifierRegistry {
        if (!exists<VerifierRegistry>(registry_addr)) {
            return vector::empty<address>()
        };
        
        let registry = borrow_global<VerifierRegistry>(registry_addr);
        registry.verifiers
    }

    /// Get total badge count
    #[view]
    public fun get_badge_count(registry_addr: address): u64 acquires BadgeRegistry {
        if (!exists<BadgeRegistry>(registry_addr)) {
            return 0
        };
        
        let badge_store = borrow_global<BadgeRegistry>(registry_addr);
        vector::length(&badge_store.badges)
    }

    // =================== Helper Functions ===================
    
    /// Check if vector contains an address
    fun vector_contains(vec: &vector<address>, item: &address): bool {
        let len = vector::length(vec);
        let mut i = 0;
        while (i < len) {
            if (vector::borrow(vec, i) == item) {
                return true
            };
            i = i + 1;
        };
        false
    }

    /// Find index of address in vector
    fun vector_index_of(vec: &vector<address>, item: &address): (bool, u64) {
        let len = vector::length(vec);
        let mut i = 0;
        while (i < len) {
            if (vector::borrow(vec, i) == item) {
                return (true, i)
            };
            i = i + 1;
        };
        (false, 0)
    }
}
