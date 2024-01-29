import { z } from 'zod';

export const NewsSchema = z.object({
  keyword: z.string(),
  link: z.string(),
  source: z.string(),
  title: z.string(),
  sentiment: z.string(),
  image: z.string(),
  datetime: z.date(),
  time: z.string(),
  article: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type News = z.infer<typeof NewsSchema>;

export const RelatedNewsSchema = z.object({
  link: z.string(),
  source: z.string(),
  article: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type RelatedNews = z.infer<typeof RelatedNewsSchema>;