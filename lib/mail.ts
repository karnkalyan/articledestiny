import nodemailer from "nodemailer";
import { db } from "@/lib/db";

export interface MailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
}

const MAIL_KEYS = ["mail_host", "mail_port", "mail_user", "mail_pass", "mail_from", "mail_secure"];

export async function getMailConfig(): Promise<MailConfig | null> {
  const settings = await db.siteSetting.findMany({
    where: { key: { in: MAIL_KEYS } },
  });
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));
  const host = map.get("mail_host") || process.env.SMTP_HOST || "";
  const port = Number(map.get("mail_port") || process.env.SMTP_PORT || 587);
  const user = map.get("mail_user") || process.env.SMTP_USER || "";
  const pass = map.get("mail_pass") || process.env.SMTP_PASS || "";
  const from = map.get("mail_from") || process.env.SMTP_FROM || user;
  const secure = (map.get("mail_secure") || process.env.SMTP_SECURE || "false") === "true";

  if (!host || !user || !pass || !from) return null;
  return { host, port, user, pass, from, secure };
}

export async function sendMail(options: { to: string | string[]; subject: string; html: string; text?: string }) {
  const config = await getMailConfig();
  if (!config) return { skipped: true, reason: "SMTP settings are incomplete." };

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transport.sendMail({
    from: config.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  return { sent: true };
}

export async function notifySubscribersForArticle(article: {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
}) {
  const subscribers = await db.subscriber.findMany({
    where: { active: true },
    select: { email: true },
  });
  if (subscribers.length === 0) return { sent: 0 };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3400";
  const articleUrl = `${siteUrl}/blog/${article.slug}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#111827">
      <h1 style="font-size:24px;line-height:1.2">${article.title}</h1>
      ${article.coverImage ? `<img src="${article.coverImage}" alt="" style="width:100%;max-height:320px;object-fit:cover;border-radius:12px" />` : ""}
      <p style="font-size:15px;line-height:1.6;color:#4b5563">${article.excerpt}</p>
      <a href="${articleUrl}" style="display:inline-block;background:#493fdf;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">Read the new story</a>
      <p style="font-size:12px;color:#9ca3af;margin-top:24px">You are receiving this because you subscribed to ArticleDestiny.</p>
    </div>
  `;

  const result = await sendMail({
    to: subscribers.map((subscriber) => subscriber.email),
    subject: `New story: ${article.title}`,
    html,
    text: `${article.title}\n\n${article.excerpt}\n\n${articleUrl}`,
  });

  return { ...result, sent: subscribers.length };
}
