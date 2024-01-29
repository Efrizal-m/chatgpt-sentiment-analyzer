import { z } from 'zod';

export const SiteDomainSchema = z.object({
  siteName: z.string(),
  siteUrl: z.string(),
  domain: z.string(),
  logoUrl: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type SiteDomains = z.infer<typeof SiteDomainSchema>;