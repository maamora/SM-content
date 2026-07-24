package com.maamora.studio.config;

import com.maamora.studio.model.Template;
import com.maamora.studio.model.enums.Format;
import com.maamora.studio.repository.TemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Order(2)
public class TemplateSeeder implements ApplicationRunner {

    private final TemplateRepository templateRepository;

    @Override
    public void run(ApplicationArguments args) {
        seedIfMissing("bold.html", "Bold Square", Format.SQUARE_POST);
        seedIfMissing("story.html", "Bold Story", Format.STORY);
    }

    private void seedIfMissing(String htmlPath, String name, Format format) {
        if (templateRepository.existsByHtmlPath(htmlPath)) return;

        templateRepository.save(Template.builder()
                .name(name)
                .format(format)
                .htmlPath(htmlPath)
                .build());
    }
}
