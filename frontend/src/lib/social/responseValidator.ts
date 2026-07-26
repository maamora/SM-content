export class ResponseValidator {
    static validate(response: string | undefined | null): string {
        if (!response || typeof response !== "string") {
            throw new Error("Invalid response received from the generation service.");
        }

        const trimmed = response.trim();
        if (trimmed.length === 0) {
            throw new Error("Generated response is completely empty.");
        }

        // We can add further validation here if needed, 
        // such as checking for minimum character count or blocked words.

        return trimmed;
    }
}
