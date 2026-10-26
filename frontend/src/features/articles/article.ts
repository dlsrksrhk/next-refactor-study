export type Article = {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
};
export type ArticleDraft = Pick<Article, "title" | "body">;
export type User = { id: string; name: string };
