import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./db";
import { sendEmail } from "./email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  rateLimit: {
    enabled: true,
    window: 60, // seconds
    max: 100, // generous for get-session calls; customRules tighten the risky ones
    customRules: {
      "/sign-in/email": {
        max: 10,
        window: 60,
      },
      "/sign-up/email": {
        max: 5,
        window: 60,
      },
      "/forget-password": {
        max: 5,
        window: 60,
      },
    },
  },

  trustedOrigins: (
    process.env.TRUSTED_ORIGINS ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3000"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,

    // Flip in env ONLY once RESEND_API_KEY + a verified domain are live.
    // Warning: it blocks login for existing users with emailVerified=false —
    // backfill them first (see caveats).
    requireEmailVerification:
      process.env.REQUIRE_EMAIL_VERIFICATION === "true",

    sendResetPassword: async ({ user, url }) => {
      await sendEmail(
        user.email,
        "Reset your Vastra password",
        `<p>Hi ${user.name},</p>
         <p>Use this link to choose a new password (valid for one hour):</p>
         <p><a href="${url}">Choose a new password</a></p>`
      );
    },
  },

  emailVerification: {
    sendOnSignUp: true,

    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail(
        user.email,
        "Verify your email for Vastra",
        `<p>Welcome to Vastra, ${user.name}!</p>
         <p><a href="${url}">Verify your email address</a></p>`
      );
    },
  },

  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
        input: false,
      },
      role: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },

  plugins: [nextCookies()],
});
