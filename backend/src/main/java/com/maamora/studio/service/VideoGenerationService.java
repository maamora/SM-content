package com.maamora.studio.service;

public interface VideoGenerationService {
    boolean isConfigured();

    byte[] generateVideo(String imageUrl, String prompt, String aspectRatio);
}
