import { NextResponse } from 'next/server';
import { PromptBuilder, type SocialParams } from '@/lib/social/promptBuilder';
import { GeminiService } from '@/lib/social/geminiService';
import { ResponseValidator } from '@/lib/social/responseValidator';

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as SocialParams;

        // 1. Build the prompt
        const prompt = PromptBuilder.build(body);

        // 2. Call the Gemini service
        const rawResult = await GeminiService.generate(prompt);

        // 3. Validate the response
        const validResult = ResponseValidator.validate(rawResult);

        // 4. Return to client
        return NextResponse.json({ result: validResult });
    } catch (err: any) {
        console.error("Error generating social post:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
