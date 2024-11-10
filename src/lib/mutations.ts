import { useMutation } from '@tanstack/vue-query';
import type { InferResponseType } from 'hono';

import { client } from './client';

type UploadPost200 = InferResponseType<typeof client.api.rag.upload.$post, 200>;

export function useUploadMutation(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch('/api/rag/upload', {
        method: 'POST',
        body: formData,
      });
      if (!resp.ok) throw new Error(await resp.text());
      return (await resp.json()) as UploadPost200;
    },
    onSuccess: options?.onSuccess,
  });
}

export function useQueryMutation(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: async (question: string) => {
      const resp = await client.api.rag.query.$post({
        json: { question },
      });
      if (!resp.ok) throw new Error(await resp.text());
      return resp.json();
    },
    onSuccess: options?.onSuccess,
  });
}
