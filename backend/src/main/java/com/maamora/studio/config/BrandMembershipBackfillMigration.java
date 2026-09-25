package com.maamora.studio.config;

import com.maamora.studio.model.BrandMembership;
import com.maamora.studio.model.User;
import com.maamora.studio.model.enums.BrandRole;
import com.maamora.studio.repository.BrandMembershipRepository;
import com.maamora.studio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * One-time backfill for the new brand_membership table introduced to support
 * real multi-brand accounts (see BrandMembership for the full story). Every
 * account that predates this table only ever had User.brand/brandRole — a
 * single pointer — with no roster of every brand it belongs to. This creates
 * the missing BrandMembership row for each of those existing users from
 * their current brand/brandRole, so login() has something to work with
 * immediately instead of everyone showing up as a member of zero brands.
 *
 * Runs after BrandOwnerBackfillMigration (@Order(1)) so the brandRole it
 * copies has already been corrected for brands that were missing an owner.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(2)
public class BrandMembershipBackfillMigration implements ApplicationRunner {

    private final UserRepository userRepository;
    private final BrandMembershipRepository brandMembershipRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<User> users = userRepository.findAll();
        int created = 0;

        for (User user : users) {
            if (user.getBrand() == null) {
                continue;
            }
            if (brandMembershipRepository.existsByUser_IdAndBrand_Id(user.getId(), user.getBrand().getId())) {
                continue;
            }
            BrandMembership membership = BrandMembership.builder()
                    .user(user)
                    .brand(user.getBrand())
                    .brandRole(user.getBrandRole() == null ? BrandRole.MEMBER : user.getBrandRole())
                    .build();
            brandMembershipRepository.save(membership);
            created++;
        }

        if (created > 0) {
            log.info("Backfilled {} brand membership row(s) from existing user.brand pointers.", created);
        }
    }
}
