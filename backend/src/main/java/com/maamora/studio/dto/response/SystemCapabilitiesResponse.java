package com.maamora.studio.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SystemCapabilitiesResponse {
    private boolean captionGeneration;
    private boolean imageGeneration;
    private boolean cloudStorage;
    private boolean localStorage;
    private boolean socialPublishing;
    private boolean emailDelivery;
}
