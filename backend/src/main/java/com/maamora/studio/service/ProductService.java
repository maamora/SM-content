package com.maamora.studio.service;

import com.maamora.studio.dto.request.ProductRequest;
import com.maamora.studio.exception.ForbiddenException;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.Product;
import com.maamora.studio.model.User;
import com.maamora.studio.model.enums.ProductStatus;
import com.maamora.studio.repository.ProductRepository;
import com.maamora.studio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final BrandSettingsService brandSettingsService;
    private final UserRepository userRepository;

    /** Everyone in the workspace sees every product in their brand — no approval/visibility gating. */
    public List<Product> listForUser(String userId) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        return productRepository.findByBrandId(brand.getId());
    }

    /** Any brand member's product goes live immediately — no approval gate between teammates. */
    public Product create(String userId, ProductRequest request) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        ProductStatus status = ProductStatus.APPROVED;

        Product product = Product.builder()
                .brand(brand)
                .createdBy(user)
                .name(request.getName())
                .description(request.getDescription())
                .sellingPoint(request.getSellingPoint())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .imageUrl2(request.getImageUrl2())
                .imageUrl3(request.getImageUrl3())
                .status(status)
                .build();
        return productRepository.save(product);
    }

    /** Any member of the brand can edit any of the brand's products. */
    public Product update(String userId, String productId, ProductRequest request) {
        Product product = getOwned(userId, productId);
        assertCanEdit(userId, product);
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setSellingPoint(request.getSellingPoint());
        product.setPrice(request.getPrice());
        product.setImageUrl(request.getImageUrl());
        product.setImageUrl2(request.getImageUrl2());
        product.setImageUrl3(request.getImageUrl3());
        return productRepository.save(product);
    }

    public void delete(String userId, String productId) {
        Product product = getOwned(userId, productId);
        assertCanEdit(userId, product);
        productRepository.delete(product);
    }

    /**
     * Any member of the brand that owns this product may edit or delete it —
     * not just whoever originally submitted it. getOwned() above already
     * scoped the lookup to the caller's own brand (findByIdAndBrandId), so by
     * the time we get here brand membership is already proven; this is just
     * a safety net in case that ever changes.
     */
    private void assertCanEdit(String userId, Product product) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        if (product.getBrand() == null || !product.getBrand().getId().equals(brand.getId())) {
            throw new ForbiddenException("You can only edit or delete products in your own workspace.");
        }
    }

    /** Brand-scoped lookup used for edit/delete authorization checks. */
    public Product getOwned(String userId, String productId) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        return productRepository.findByIdAndBrandId(productId, brand.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));
    }

    /**
     * Single-product lookup for the detail page. No status gating anymore —
     * every product in the caller's brand is visible to every member of that
     * brand (getOwned() already scopes the lookup to the caller's brand).
     */
    public Product getVisible(String userId, String productId) {
        return getOwned(userId, productId);
    }

    /** Admin-only: every product currently awaiting review. */
    public List<Product> listPending() {
        return productRepository.findByStatus(ProductStatus.PENDING);
    }

    public Product approve(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));
        product.setStatus(ProductStatus.APPROVED);
        return productRepository.save(product);
    }

    /** Rejected products aren't kept around in a "rejected" state — they're removed outright. */
    public void reject(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));
        productRepository.delete(product);
    }
}
