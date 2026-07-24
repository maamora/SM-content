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
    private final String imageUrl2;
    private final String imageUrl3;
    private final String status;
    private final String createdByName;
    private final String createdById;

    public ProductResponse(Product p) {
        this.id = p.getId();
        this.name = p.getName();
        this.description = p.getDescription();
        this.sellingPoint = p.getSellingPoint();
        this.price = p.getPrice();
        this.imageUrl = p.getImageUrl();
        this.imageUrl2 = p.getImageUrl2();
        this.imageUrl3 = p.getImageUrl3();
        this.status = p.getStatus().name();
        this.createdByName = p.getCreatedBy() != null ? p.getCreatedBy().getName() : null;
        this.createdById = p.getCreatedBy() != null ? p.getCreatedBy().getId() : null;
    }
}
