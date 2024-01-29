import { z } from 'zod';

export const DomainSchema = z.object({
  source: z.string(),
  sitemapUrls: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type Domains = z.infer<typeof DomainSchema>;