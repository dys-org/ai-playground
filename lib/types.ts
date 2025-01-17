import { z } from 'zod';

export const modelEnum = z.enum(['claude-3-5-sonnet-latest', 'gpt-4o', 'gpt-4o-mini']);
export type AiModelType = z.infer<typeof modelEnum>;
