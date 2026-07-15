package com.maamora.studio.repository;

import com.maamora.studio.model.Template;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TemplateRepository extends JpaRepository<Template, String> {
    List<Template> findByBrandIdOrBrandIdIsNull(String brandId);
}
