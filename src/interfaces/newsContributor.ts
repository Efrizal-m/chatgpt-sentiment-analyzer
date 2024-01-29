import { z } from 'zod';

export const NewsContributorSchema = z.object({
  keyword: z.string(),
  source: z.string(),
  urls: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type NewsContributor = z.infer<typeof NewsContributorSchema>;