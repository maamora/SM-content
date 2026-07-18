package com.maamora.studio.dto.response;

import com.maamora.studio.model.Product;
import lombok.Getter;

@Getter
public class ProductResponse {
    private final String id;
    private final String name;
    private final String description;
    private final String sellingPoint;
    private final Double price;
    private final String imageUrl;
    private final String status;

    public ProductResponse(Product p) {
        this.id = p.getId();
        this.name = p.getName();
        this.description = p.getDescription();
        this.sellingPoint = p.getSellingPoint();
        this.price = p.getPrice();
        this.imageUrl = p.getImageUrl();
        this.status = p.getStatus().name();
    }
}
