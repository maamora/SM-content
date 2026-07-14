package com.maamora.studio.dto.response;

import com.maamora.studio.model.Template;
import lombok.Getter;

@Getter
public class TemplateResponse {
    private final String id;
    private final String name;
    private final String format;
    private final String thumbnailUrl;

    public TemplateResponse(Template t) {
        this.id = t.getId();
        this.name = t.getName();
        this.format = t.getFormat().name();
        this.thumbnailUrl = t.getThumbnailUrl();
    }
}
