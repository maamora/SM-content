package com.maamora.studio.config;

import com.maamora.studio.model.Product;
import com.maamora.studio.model.enums.ProductStatus;
import com.maamora.studio.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * One-time cleanup for the approval gate removed from ProductService.create():
 * any product still sitting in PENDING from before that change shipped
 * (submitted by a non-admin teammate under the old rule) would otherwise stay
 * invisible to the rest of the brand forever, waiting on an approval step
 * that no longer exists anywhere in the app. This auto-approves those
 * leftovers on every boot. Once nothing is PENDING, it's a no-op.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProductApprovalMigration implements ApplicationRunner {

    private final ProductRepository productRepository;

    @Override
    public void run(ApplicationArguments args) {
        List<Product> stuck = productRepository.findByStatus(ProductStatus.PENDING);
        if (stuck.isEmpty()) {
            return;
        }
        stuck.forEach(p -> p.setStatus(ProductStatus.APPROVED));
        productRepository.saveAll(stuck);
        log.info("Auto-approved {} product(s) left over from the old approval gate.", stuck.size());
    }
}
