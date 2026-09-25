package com.maamora.studio.model.enums;

/**
 * A user's standing within their own brand workspace — distinct from Role
 * (USER/ADMIN), which is the platform-wide staff/customer distinction used
 * for the /admin control room. BrandRole only matters inside a single
 * brand's Members settings:
 *  - OWNER: whoever created the brand (or personal workspace). Exactly one
 *    per brand. Can kick/ban/promote members and is the only one who can
 *    delete the brand outright.
 *  - ADMIN: promoted by the OWNER. Same day-to-day moderation powers
 *    (kick/ban/promote) as the owner, except deleting the brand itself.
 *  - MEMBER: default for anyone who joins an existing brand via its join
 *    code or accepts an invite. Can create/edit their own products same as
 *    everyone else, but no member-management powers.
 */
public enum BrandRole {
    OWNER,
    ADMIN,
    MEMBER
}
