package com.maamora.studio.config;

/**
 * Demo-product seeding used to run on every new brand's registration and on
 * every backend boot (for any existing brand with an empty catalogue),
 * dropping five sample products ("Classic Running Shoes", etc.) into every
 * workspace whether it wanted them or not — a new user's "Your products"
 * page was never actually empty, it just looked like a real catalogue full
 * of someone else's stock photos.
 *
 * Deliberately gutted rather than deleted: nothing calls into this class
 * anymore (AuthService.register() no longer calls seedFor(), and this is no
 * longer an ApplicationRunner so it doesn't fire at boot either), so a brand
 * — new or existing — only ever has the products someone actually added.
 * The class name is kept as a placeholder in case real starter-catalogue
 * seeding is wanted again later, but intentionally does nothing right now.
 */
public class ProductSeeder {
}
