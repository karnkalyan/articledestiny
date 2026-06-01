"use server";

import { db } from "@/lib/db";
import { sendMail, getMailConfig } from "@/lib/mail";

export async function subscribeToNewsletter(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { error: "Please enter a valid email address." };
  }

  await db.subscriber.upsert({
    where: { email: cleanEmail },
    create: { email: cleanEmail, active: true },
    update: { active: true },
  });

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
