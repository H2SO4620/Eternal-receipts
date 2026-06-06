module eternal_receipts::receipt {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::dynamic_field;
    use std::string::{Self, String};

    // ========== Errors ==========
    const ENotOwner: u64 = 0;

    // ========== Structs ==========

    /// Core receipt object — owned by the user's wallet
    public struct PurchaseReceipt has key, store {
        id: UID,
        blob_id: String,
        store_name: String,
        purchase_date: String,
        total_cents: u64,
        currency: String,
        category: String,
        warranty_expiry: String,
        content_hash: String,
        owner: address,
        version: u64,
        created_at: u64,
    }

    /// Shared object — allows any frontend tx to call mint_receipt
    public struct MintCap has key {
        id: UID,
    }

    /// Events
    public struct ReceiptMinted has copy, drop {
        receipt_id: address,
        blob_id: String,
        owner: address,
        store_name: String,
        total_cents: u64,
        category: String,
    }

    public struct ReceiptUpdated has copy, drop {
        receipt_id: address,
        new_blob_id: String,
        version: u64,
    }

    // ========== Init ==========

    fun init(ctx: &mut TxContext) {
        transfer::share_object(MintCap {
            id: object::new(ctx),
        });
    }

    // ========== Entry Functions ==========

    public entry fun mint_receipt(
        _cap: &MintCap,
        blob_id: vector<u8>,
        store_name: vector<u8>,
        purchase_date: vector<u8>,
        total_cents: u64,
        currency: vector<u8>,
        category: vector<u8>,
        warranty_expiry: vector<u8>,
        content_hash: vector<u8>,
        created_at: u64,
        ctx: &mut TxContext,
    ) {
        let owner = tx_context::sender(ctx);
        let receipt_uid = object::new(ctx);
        let receipt_id = object::uid_to_address(&receipt_uid);

        let receipt = PurchaseReceipt {
            id: receipt_uid,
            blob_id: string::utf8(blob_id),
            store_name: string::utf8(store_name),
            purchase_date: string::utf8(purchase_date),
            total_cents,
            currency: string::utf8(currency),
            category: string::utf8(category),
            warranty_expiry: string::utf8(warranty_expiry),
            content_hash: string::utf8(content_hash),
            owner,
            version: 1,
            created_at,
        };

        event::emit(ReceiptMinted {
            receipt_id,
            blob_id: receipt.blob_id,
            owner,
            store_name: receipt.store_name,
            total_cents,
            category: receipt.category,
        });

        transfer::transfer(receipt, owner);
    }

    /// Update blob ID — only owner can call
    public entry fun update_blob(
        receipt: &mut PurchaseReceipt,
        new_blob_id: vector<u8>,
        new_content_hash: vector<u8>,
        ctx: &mut TxContext,
    ) {
        assert!(tx_context::sender(ctx) == receipt.owner, ENotOwner);
        receipt.blob_id = string::utf8(new_blob_id);
        receipt.content_hash = string::utf8(new_content_hash);
        receipt.version = receipt.version + 1;

        event::emit(ReceiptUpdated {
            receipt_id: object::uid_to_address(&receipt.id),
            new_blob_id: receipt.blob_id,
            version: receipt.version,
        });
    }

    /// Add a line item as a dynamic field
    public entry fun add_line_item(
        receipt: &mut PurchaseReceipt,
        item_name: vector<u8>,
        item_price_cents: u64,
        ctx: &mut TxContext,
    ) {
        assert!(tx_context::sender(ctx) == receipt.owner, ENotOwner);
        dynamic_field::add(
            &mut receipt.id,
            string::utf8(item_name),
            item_price_cents,
        );
    }

    // ========== Accessors ==========

    public fun blob_id(r: &PurchaseReceipt): &String { &r.blob_id }
    public fun owner(r: &PurchaseReceipt): address { r.owner }
    public fun total_cents(r: &PurchaseReceipt): u64 { r.total_cents }
    public fun version(r: &PurchaseReceipt): u64 { r.version }
}
