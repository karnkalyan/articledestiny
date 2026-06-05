import bcrypt from "bcryptjs";
import bloggerData from "./data-202662172.json";
import { db } from "./db";
import { generateSeo, stripHtml } from "./seo";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function getAlternateUrl(entry: any) {
  return (
    entry.link?.find(
      (link: any) =>
        link.rel === "alternate" && link.type === "text/html"
    )?.href || ""
  );
}

function getCoverImage(entry: any) {
  const thumbnail = entry["media$thumbnail"]?.url;
  if (thumbnail) return thumbnail.replace(/=s72-[^"]+$/, "");

  const match = String(entry.content?.$t || "").match(
    /<img[^>]+src=["']([^"']+)["']/i
  );

  return (
    match?.[1] ||
    "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800"
  );
}

async function seedProfiles(ownerId: number, adminId: number, readerId: number) {
  await db.authorProfile.upsert({
    where: { userId: ownerId },
    create: {
      userId: ownerId,
      tagline: "Founder, full-stack developer, and ArticleDestiny editor.",
      taglineVisible: true,
      bio: "Karn Kalyan writes about technology, life, design, and the strange little details that turn simple stories into useful reflections.",
      bioVisible: true,
      location: "Kathmandu, Nepal",
      locationVisible: true,
      website: "https://articledestiny.com",
      websiteVisible: true,
      twitter: "",
      twitterVisible: true,
      github: "",
      githubVisible: true,
      linkedin: "",
      linkedinVisible: true,
      phone: "",
      phoneVisible: false,
      avatar: "",
      avatarVisible: true,
    },
    update: {
      taglineVisible: true,
      bioVisible: true,
      locationVisible: true,
      websiteVisible: true,
      avatarVisible: true,
    },
  });

  await db.authorProfile.upsert({
    where: { userId: adminId },
    create: {
      userId: adminId,
      tagline: "Editorial administrator for ArticleDestiny.",
      taglineVisible: true,
      bio: "Maintains publishing quality, site settings, SEO, and community workflows.",
      bioVisible: true,
      location: "ArticleDestiny",
      locationVisible: true,
      website: "https://articledestiny.com",
      websiteVisible: true,
    },
    update: {
      taglineVisible: true,
      bioVisible: true,
      locationVisible: true,
      websiteVisible: true,
    },
  });

  await db.authorProfile.upsert({
    where: { userId: readerId },
    create: {
      userId: readerId,
      tagline: "ArticleDestiny reader profile.",
      taglineVisible: true,
      bio: "A reader account used for testing comments, likes, and reading history.",
      bioVisible: true,
    },
    update: {
      taglineVisible: true,
      bioVisible: true,
    },
  });
}

export async function ensureSeeded() {
  console.log("Seed started...");

  try {
    const hashedPasswordAdmin = await bcrypt.hash("admin123", 10);
    const hashedPasswordUser = await bcrypt.hash("user123", 10);

    console.log("Seeding users...");

    const owner = await db.user.upsert({
      where: { email: "karnkalyan@gmail.com" },
      create: {
        id: 3,
        name: "Karn Kalyan",
        email: "karnkalyan@gmail.com",
        password: hashedPasswordAdmin,
        role: "ADMIN",
      },
      update: {
        name: "Karn Kalyan",
        role: "ADMIN",
      },
    });

    const admin = await db.user.upsert({
      where: { email: "admin@articledestiny.com" },
      create: {
        id: 1,
        name: "ArticleDestiny Admin",
        email: "admin@articledestiny.com",
        password: hashedPasswordAdmin,
        role: "ADMIN",
      },
      update: {
        role: "ADMIN",
      },
    });

    const reader = await db.user.upsert({
      where: { email: "user@articledestiny.com" },
      create: {
        id: 2,
        name: "ArticleDestiny Reader",
        email: "user@articledestiny.com",
        password: hashedPasswordUser,
        role: "USER",
      },
      update: {
        role: "USER",
      },
    });

    console.log("Seeding author profiles...");
    await seedProfiles(owner.id, admin.id, reader.id);

    console.log("Loading articles from DB...");
    const existingCount = await db.article.count();
    console.log("Existing articles:", existingCount);

    console.log("Parsing blogger data...");
    const entries = (bloggerData as any)?.feed?.entry;

    if (!Array.isArray(entries) || entries.length === 0) {
      console.error("No valid entries found in JSON");
      return;
    }

    console.log(`Entries found: ${entries.length}`);
    console.log("Clearing articles...");
    await db.article.deleteMany();

    console.log("Importing articles...");

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      try {
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
            createdAt: entry.published?.$t
              ? new Date(entry.published.$t)
              : new Date(),
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

        console.log(`Inserted: ${title}`);
      } catch (err) {
        console.error(`Failed entry ${i}:`, err);
      }
    }

    const finalCount = await db.article.count();
    console.log(`Done. Total articles now: ${finalCount}`);
  } catch (error) {
    console.error("Seeding failed:", error);
    throw error;
  }
}

if (
  require.main === module ||
  (process.argv[1] &&
    (process.argv[1].endsWith("seed.ts") ||
      process.argv[1].endsWith("seed.js")))
) {
  ensureSeeded()
    .then(() => {
      console.log("Done");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Fatal error:", err);
      process.exit(1);
    });
}
