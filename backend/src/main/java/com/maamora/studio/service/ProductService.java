package com.maamora.studio.service;

import com.maamora.studio.dto.request.ProductRequest;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.Product;
import com.maamora.studio.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final BrandSettingsService brandSettingsService;

    public List<Product> listForUser(String userId) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        return productRepository.findByBrandId(brand.getId());
    }

    public Product create(String userId, ProductRequest request) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        Product product = Product.builder()
                .brand(brand)
                .name(request.getName())
                .description(request.getDescription())
                .sellingPoint(request.getSellingPoint())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .build();
        return productRepository.save(product);
    }

    public Product update(String userId, String productId, ProductRequest request) {
        Product product = getOwned(userId, productId);
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setSellingPoint(request.getSellingPoint());
        product.setPrice(request.getPrice());
        product.setImageUrl(request.getImageUrl());
        return productRepository.save(product);
    }

    public void delete(String userId, String productId) {
        Product product = getOwned(userId, productId);
        productRepository.delete(product);
    }

    public Product getOwned(String userId, String productId) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        return productRepository.findByIdAndBrandId(productId, brand.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));
    }
}
