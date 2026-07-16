package com.maamora.studio.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class ProductRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String description;

    private String sellingPoint;

    @PositiveOrZero
    private Double price;

    private String imageUrl;
}
