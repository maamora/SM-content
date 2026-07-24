package com.maamora.studio.exception;

public class CaptionGenerationException extends RuntimeException {
    public CaptionGenerationException(String message) {
        super(message);
    }

    public CaptionGenerationException(String message, Throwable cause) {
        super(message, cause);
    }
}
