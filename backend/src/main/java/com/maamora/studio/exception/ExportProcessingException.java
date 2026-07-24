package com.maamora.studio.exception;

public class ExportProcessingException extends RuntimeException {
    public ExportProcessingException(String message) {
        super(message);
    }

    public ExportProcessingException(String message, Throwable cause) {
        super(message, cause);
    }
}
