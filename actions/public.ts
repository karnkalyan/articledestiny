"use server";

import { db } from "@/lib/db";
import { sendMail, getMailConfig } from "@/lib/mail";

export async function subscribeToNewsletter(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { error: "Please enter a valid email address." };
  }

  // Check if subscriber already exists
  const existing = await db.subscriber.findUnique({ where: { email: cleanEmail } });
  const isNew = !existing || !existing.active;

  await db.subscriber.upsert({
    where: { email: cleanEmail },
    create: { email: cleanEmail, active: true },
    update: { active: true },
  });

  // Send welcome email for new subscribers
  if (isNew) {
    try {
      await sendMail({
        to: cleanEmail,
        subject: "Welcome to ArticleDestiny! 🎉",
        html: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
            <div style="background:linear-gradient(135deg,#2563eb 0%,#4338ca 100%);padding:40px 32px;text-align:center">
              <h1 style="color:#ffffff;font-size:28px;margin:0 0 8px;font-weight:800">Welcome to ArticleDestiny</h1>
              <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0">Thank you for subscribing!</p>
            </div>
            <div style="padding:32px">
              <p style="font-size:15px;line-height:1.7;color:#374151;margin:0 0 16px">
                Hi there! 👋
              </p>
              <p style="font-size:15px;line-height:1.7;color:#374151;margin:0 0 16px">
                We're thrilled to have you join the ArticleDestiny community. You'll now receive curated stories about technology, design, life, and creative ideas — delivered straight to your inbox whenever we publish something new.
              </p>
              <p style="font-size:15px;line-height:1.7;color:#374151;margin:0 0 24px">
                Every article is carefully crafted to inspire, inform, and help you think deeper about the topics that matter most.
              </p>
              <div style="text-align:center;margin:24px 0">
                <a href="https://articledestiny.com" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#4338ca);color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px">Explore ArticleDestiny</a>
              </div>
              <p style="font-size:13px;color:#9ca3af;margin:24px 0 0;text-align:center">
                You're receiving this because you subscribed at ArticleDestiny. If this wasn't you, simply ignore this email.
              </p>
            </div>
          </div>
        `,
        text: "Welcome to ArticleDestiny! Thank you for subscribing. You'll receive curated stories about technology, design, life, and creative ideas straight to your inbox. Visit https://articledestiny.com to explore.",
      });
    } catch (err) {
      console.error("Failed to send welcome email:", err);
    }
  }

  return { success: true };
}

export async function submitContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();
  const subject = data.subject.trim();
  const message = data.message.trim();

  if (!name || !email || !subject || !message) {
    return { error: "All fields are required." };
  }

  const saved = await db.contactMessage.create({
    data: { name, email, subject, message },
  });

  try {
    const mailConfig = await getMailConfig();
    const adminEmail = process.env.CONTACT_TO_EMAIL || mailConfig?.from || "";
    if (adminEmail) {
      await sendMail({
        to: adminEmail,
        subject: `New contact message: ${subject}`,
        html: `<p><strong>${name}</strong> (${email}) wrote:</p><p>${message.replace(/\n/g, "<br />")}</p>`,
        text: `${name} (${email}) wrote:\n\n${message}`,
      });
    }
  } catch (error) {
    console.error("Failed to send contact message email notification:", error);
  }

  return { success: true, id: saved.id };
}
