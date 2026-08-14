package com.maamora.studio.repository;

import com.maamora.studio.model.Product;
import com.maamora.studio.model.enums.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, String> {
    List<Product> findByBrandId(String brandId);
    Optional<Product> findByIdAndBrandId(String id, String brandId);
    List<Product> findByStatus(ProductStatus status);
}
