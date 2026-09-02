// core/email.ts
import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  fromAccount?: "billing" | "order" | "partners" | "support" | "default";
  replyTo?: string;
  cc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: any;
    contentType?: string;
  }>;
}

const SMTP_PROFILES = {
  default: {
    host: "mail.asianspices.online",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_ORDER_USER || "order@asianspices.online",
      pass: process.env.SMTP_ORDER_PASS || "",
    },
    fromAddress: '"Asian Spices Orders" <order@asianspices.online>',
  },
  order: {
    host: "mail.asianspices.online",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_ORDER_USER || "order@asianspices.online",
      pass: process.env.SMTP_ORDER_PASS || "",
    },
    fromAddress: '"Asian Spices Orders" <order@asianspices.online>',
  },
  billing: {
    host: "mail.asianspices.online",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_FINANCE_USER || "finance@asianspices.online",
      pass: process.env.SMTP_FINANCE_PASS || "",
    },
    fromAddress: '"Asian Spices Finance" <finance@asianspices.online>',
  },

  partners: {
    host: "mail.asianspices.online",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_PARTNERS_USER || "partners@asianspices.online",
      pass: process.env.SMTP_PARTNERS_PASS || "",
    },
    fromAddress: '"Asian Spices Partners" <partners@asianspices.online>',
  },
  
  support: {
    host: "mail.asianspices.online",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_SUPPORT_USER || "support@asianspices.online",
      pass: process.env.SMTP_SUPPORT_PASS || "",
    },
    fromAddress: '"Asian Spices Support" <support@asianspices.online>',
  },
};

type ProfileKey = keyof typeof SMTP_PROFILES;
const transporterCache = new Map<string, nodemailer.Transporter>();

function getTransporter(profileKey: ProfileKey) {
  const profile = SMTP_PROFILES[profileKey] || SMTP_PROFILES.default;

  if (!transporterCache.has(profileKey)) {
    const transporter = nodemailer.createTransport({
      host: profile.host,
      port: profile.port,
      secure: profile.secure,
      auth: {
        user: profile.auth.user,
        pass: profile.auth.pass,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
    transporterCache.set(profileKey, transporter);
  }

  return {
    transporter: transporterCache.get(profileKey)!,
    fromAddress: profile.fromAddress,
  };
}

export async function sendEmail({
  to,
  subject,
  html,
  fromAccount = "default",
  replyTo,
  cc,
  attachments,
}: EmailOptions) {
  console.log(
    "sendEmail SMTP_PROFILES[fromAccount] === ",
    SMTP_PROFILES[fromAccount],
  );

  const profileKey: ProfileKey = SMTP_PROFILES[fromAccount]
    ? fromAccount
    : "default";
 
  const { transporter, fromAddress } = getTransporter(profileKey);

  // const defaultCC = ["admin@asianspices.online", "backup@asianspices.online"];
  // const finalCC = cc ? (Array.isArray(cc) ? [...cc, ...defaultCC] : [cc, ...defaultCC]) : defaultCC;

  const mailOptions = {
    from: fromAddress,
    to,
    cc,
    subject,
    html,
    replyTo,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV !== "production") {
      console.log(`[Email Sent] ID: ${info.messageId} via [${profileKey}]`);
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Failure] Profile [${profileKey}]:`, error);
    throw new Error(`Email dispatch failed via SMTP profile: ${profileKey}`);
  }
}
