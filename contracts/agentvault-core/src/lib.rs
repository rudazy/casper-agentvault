#![cfg_attr(not(test), no_std)]
#![cfg_attr(not(test), no_main)]
extern crate alloc;

pub mod attestation;
pub mod escrow;

pub use attestation::Attestation;
pub use escrow::Escrow;