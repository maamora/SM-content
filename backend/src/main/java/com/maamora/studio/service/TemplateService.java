package com.maamora.studio.service;

import com.maamora.studio.dto.request.TemplateRequest;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.Template;
import com.maamora.studio.repository.TemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TemplateService {

    private final TemplateRepository templateRepository;
    private final BrandSettingsService brandSettingsService;

    public List<Template> listForUser(String userId) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        return templateRepository.findByBrandIdOrBrandIdIsNull(brand.getId());
    }

    public Template create(String userId, TemplateRequest request) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        Template template = Template.builder()
                .brand(brand)
                .name(request.getName())
                .format(request.getFormat())
                .htmlPath(request.getHtmlPath())
                .thumbnailUrl(request.getThumbnailUrl())
                .build();
        return templateRepository.save(template);
    }

    public Template getById(String templateId) {
        return templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found."));
    }
}
