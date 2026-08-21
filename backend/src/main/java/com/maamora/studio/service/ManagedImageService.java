package com.maamora.studio.service;

import java.util.List;

public interface ManagedImageService {
    boolean isConfigured();
    byte[] generateImage(String prompt, String aspectRatio, List<String> references);
}
