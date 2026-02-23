/**
 * Clerk Webhook Handler
 * 
 * Syncs Clerk user data to PostgreSQL database.
 * Handles:
 * - user.created: Create new user in database
 * - user.updated: Update existing user in database
 */

import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  // Get the Svix headers for verification
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Get the webhook secret (optional, only required if using webhooks)
  const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    return new Response(
      JSON.stringify({ error: "CLERK_WEBHOOK_SECRET is not configured. Webhooks require this secret." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create a new Svix instance with the webhook secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  const { id, email_addresses, first_name, last_name, image_url, username } = evt.data;

  if (eventType === "user.created" || eventType === "user.updated") {
    try {
      // Get primary email
      const primaryEmail = email_addresses?.find((email: any) => email.id === evt.data.primary_email_address_id)?.email_address ||
                          email_addresses?.[0]?.email_address;

      if (!primaryEmail) {
        console.error("No email found for user:", id);
        return new Response("No email found", { status: 400 });
      }

      // Combine first and last name
      const fullName = [first_name, last_name].filter(Boolean).join(" ") || null;

      // Upsert user in database
      // First check if user exists to preserve existing username
      const existingUser = await prisma.user.findUnique({
        where: { clerkId: id },
        select: { username: true },
      });

      await prisma.user.upsert({
        where: {
          clerkId: id,
        },
        update: {
          email: primaryEmail,
          name: fullName,
          imageUrl: image_url || null,
          // Only update username from Clerk if user doesn't have one set
          // Once set via app, username is managed in app, not Clerk
          username: existingUser?.username || username || null,
        },
        create: {
          id: id,
          clerkId: id,
          email: primaryEmail,
          name: fullName,
          imageUrl: image_url || null,
          username: username || null, // May be null initially
        },
      });

      console.log(`User ${eventType}:`, id);
    } catch (error) {
      console.error(`Error processing ${eventType}:`, error);
      return new Response(`Error processing ${eventType}`, { status: 500 });
    }
  }

  return new Response("", { status: 200 });
}

