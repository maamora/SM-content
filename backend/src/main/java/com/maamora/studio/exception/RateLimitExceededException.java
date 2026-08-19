package com.maamora.studio.exception;

public class RateLimitExceededException extends RuntimeException {
    public RateLimitExceededException(String message) {
        super(message);
    }
}
