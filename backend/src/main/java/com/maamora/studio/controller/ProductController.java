package com.maamora.studio.controller;

import com.maamora.studio.dto.request.ProductRequest;
import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.ProductResponse;
import com.maamora.studio.security.CurrentUserProvider;
import com.maamora.studio.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final CurrentUserProvider currentUser;

    @GetMapping
    public ApiResponse<List<ProductResponse>> list() {
        var products = productService.listForUser(currentUser.getCurrentUserId())
                .stream().map(ProductResponse::new).toList();
        return ApiResponse.ok(products);
    }

    @PostMapping
    public ApiResponse<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
        var product = productService.create(currentUser.getCurrentUserId(), request);
        return ApiResponse.ok(new ProductResponse(product));
    }

    @PutMapping("/{id}")
    public ApiResponse<ProductResponse> update(@PathVariable String id, @Valid @RequestBody ProductRequest request) {
        var product = productService.update(currentUser.getCurrentUserId(), id, request);
        return ApiResponse.ok(new ProductResponse(product));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        productService.delete(currentUser.getCurrentUserId(), id);
        return ApiResponse.ok(null);
    }
}
