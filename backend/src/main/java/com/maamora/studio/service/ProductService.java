package com.maamora.studio.service;

import com.maamora.studio.dto.request.ProductRequest;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.exception.UnauthorizedException;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.Product;
import com.maamora.studio.model.User;
import com.maamora.studio.model.enums.ProductStatus;
import com.maamora.studio.model.enums.Role;
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

    /**
     * Everyone in the workspace sees every APPROVED product. PENDING products
     * are only visible to the person who submitted them (plus admins, via
     * listPending()) — a teammate shouldn't see someone else's submission
     * sitting in the catalogue before it's been reviewed.
     */
    public List<Product> listForUser(String userId) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        return productRepository.findByBrandId(brand.getId()).stream()
                .filter(p -> p.getStatus() == ProductStatus.APPROVED
                        || (p.getStatus() == ProductStatus.PENDING
                            && p.getCreatedBy() != null
                            && p.getCreatedBy().getId().equals(userId)))
                .toList();
    }

    /** Admins skip the review queue — their own submissions go live immediately. */
    public Product create(String userId, ProductRequest request) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        ProductStatus status = user.getRole() == Role.ADMIN ? ProductStatus.APPROVED : ProductStatus.PENDING;

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

    /** Regular members can only edit their own submissions; admins can edit anyone's. */
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

    private void assertCanEdit(String userId, Product product) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        boolean isOwner = product.getCreatedBy() != null && product.getCreatedBy().getId().equals(userId);
        if (user.getRole() != Role.ADMIN && !isOwner) {
            throw new UnauthorizedException("You can only edit or delete your own products.");
        }
    }

    /** Brand-scoped lookup used for edit/delete authorization checks. */
    public Product getOwned(String userId, String productId) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        return productRepository.findByIdAndBrandId(productId, brand.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));
    }

    /**
     * Single-product lookup for the detail page — applies the same
     * visibility rule as listForUser(): APPROVED is visible to everyone,
     * PENDING only to its submitter or an admin.
     */
    public Product getVisible(String userId, String productId) {
        Product product = getOwned(userId, productId);
        if (product.getStatus() == ProductStatus.APPROVED) {
            return product;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        boolean isOwner = product.getCreatedBy() != null && product.getCreatedBy().getId().equals(userId);
        if (user.getRole() == Role.ADMIN || isOwner) {
            return product;
        }
        throw new ResourceNotFoundException("Product not found.");
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
