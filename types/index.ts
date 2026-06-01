export type UserRole = "ADMIN" | "AUTHOR" | "USER";

export interface SafeUser {
  id: number;
  email: string;
  name: string;
  role: string | UserRole;
  isBanned: boolean;
  createdAt: Date;
}

export interface Article {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: string | null;
  focusKeyword?: string | null;
  seoScore: number;
  published: boolean;
  category: string;
  coverImage: string;
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  viewsCount: number;
  authorId: number;
}

export interface ArticleWithAuthor extends Article {
  author: SafeUser;
}

export interface Comment {
  id: number;
  content: string;
  status: string; // APPROVED, PENDING, REJECTED, SPAM
  createdAt: Date;
  articleId: number;
  userId: number;
  parentId: number | null;
}

export interface CommentWithUser extends Comment {
  user: SafeUser;
  replies?: CommentWithUser[];
}

export interface ReviewItem {
  id: number;
  content: string;
  status: string;
  createdAt: Date;
  articleTitle: string;
  articleSlug: string;
  userEmail: string;
  userName: string;
}

export interface Ad {
  id: number;
  placement: string;
  code: string;
  active: boolean;
}

export interface Subscriber {
  id: number;
  email: string;
  active: boolean;
  createdAt: Date;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
}

export interface ReadingHistoryItem {
  id: number;
  userId: number;
  articleId: number;
  readAt: Date;
  article: ArticleWithAuthor;
}
