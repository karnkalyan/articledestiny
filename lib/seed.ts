import bcrypt from "bcryptjs";
import bloggerData from "@/lib/data-202662172.json";
import { db } from "./db";
import { generateSeo, stripHtml } from "./seo";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function getAlternateUrl(entry: any) {
  return entry.link?.find((link: any) => link.rel === "alternate" && link.type === "text/html")?.href || "";
}

function getCoverImage(entry: any) {
  const thumbnail = entry["media$thumbnail"]?.url;
  if (thumbnail) return thumbnail.replace(/=s72-[^"]+$/, "");
  const match = String(entry.content?.$t || "").match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800";
}

export async function ensureSeeded() {
  try {
    const hashedPasswordAdmin = await bcrypt.hash("admin123", 10);
    const hashedPasswordUser = await bcrypt.hash("user123", 10);

    await db.user.upsert({
      where: { email: "admin@articledestiny.com" },
      create: {
        name: "ArticleDestiny Admin",
        email: "admin@articledestiny.com",
        password: hashedPasswordAdmin,
        role: "ADMIN",
      },
      update: { role: "ADMIN" },
    });

    const owner = await db.user.upsert({
      where: { email: "karnkalyan@gmail.com" },
      create: {
        name: "Karn Kalyan",
        email: "karnkalyan@gmail.com",
        password: hashedPasswordAdmin,
        role: "ADMIN",
      },
      update: { role: "ADMIN" },
    });

    await db.user.upsert({
      where: { email: "user@articledestiny.com" },
      create: {
        name: "ArticleDestiny Reader",
        email: "user@articledestiny.com",
        password: hashedPasswordUser,
        role: "USER",
      },
      update: {},
    });

    const importFlag = await db.siteSetting.findUnique({ where: { key: "blogger_import_202662172" } });
    if (importFlag) return;

    try {
      await db.siteSetting.create({
        data: { key: "blogger_import_202662172", value: new Date().toISOString() },
      });
    } catch {
      return;
    }

    await db.article.deleteMany();

    const entries = Array.isArray((bloggerData as any).feed?.entry) ? (bloggerData as any).feed.entry : [];
    for (const entry of entries) {
      const title = entry.title?.$t || "Untitled Story";
      const content = entry.content?.$t || "";
      const coverImage = getCoverImage(entry);
      const canonicalUrl = getAlternateUrl(entry);
      const category = "Stories";
      const excerpt = stripHtml(content).slice(0, 260);
      const seo = generateSeo({
        title,
        content,
        excerpt,
        category,
        coverImage,
        canonicalUrl,
      });

      let slug = slugify(title) || `story-${entry.id?.$t || Date.now()}`;
      let suffix = 1;
      while (await db.article.findUnique({ where: { slug } })) {
        slug = `${slugify(title)}-${suffix}`;
        suffix++;
      }

      await db.article.create({
        data: {
          slug,
          title,
          content,
          excerpt: seo.excerpt,
          category,
          coverImage,
          published: true,
          authorId: owner.id,
          createdAt: entry.published?.$t ? new Date(entry.published.$t) : new Date(),
          metaTitle: seo.metaTitle,
          metaDescription: seo.metaDescription,
          metaKeywords: seo.metaKeywords,
          canonicalUrl: seo.canonicalUrl || null,
          ogTitle: seo.ogTitle,
          ogDescription: seo.ogDescription,
          ogImage: seo.ogImage || null,
          twitterTitle: seo.twitterTitle,
          twitterDescription: seo.twitterDescription,
          twitterImage: seo.twitterImage || null,
          focusKeyword: seo.focusKeyword,
          seoScore: seo.seoScore,
        },
      });
    }
  } catch (error) {
    console.error("Database seeding encountered an issue:", error);
  }
}

if (require.main === module || (process.argv[1] && (process.argv[1].endsWith("seed.ts") || process.argv[1].endsWith("seed.js")))) {
  console.log("Seeding database via CLI...");
  ensureSeeded()
    .then(() => {
      console.log("Database seeded successfully.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Database seeding failed:", error);
      process.exit(1);
    });
}

