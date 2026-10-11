import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as dotenv from "dotenv";
import { themeCatalog, platformSettings } from "./schema";
import { THEMES } from "@/lib/themes";

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  console.log("🌱 جاري إدخال البيانات الأساسية في قاعدة البيانات...");

  // 1. إدخال القوالب العشرين المطابقة لجدول themeCatalog
  for (const theme of THEMES) {
    await db.insert(themeCatalog).values({
      id: theme.id,
      number: theme.number,
      nameEn: theme.nameEn,
      nameAr: theme.nameAr,
      industry: "general",
      descriptionEn: theme.descriptionEn,
      descriptionAr: theme.descriptionAr,
      active: true,
      sort: theme.number,
    }).onConflictDoNothing();
  }
  console.log("✅ تم إدخال القوالب بنجاح.");

  // 2. إدخال إعدادات المنصة المطابقة لجدول platformSettings
  await db.insert(platformSettings).values({
    id: "default",
    monthlyPrice: "15.000",
    yearlyPrice: "150.000",
    billingCurrency: "BHD",
    trialDays: 30,
    supportEmail: "support@tajer.com",
  }).onConflictDoNothing();
  console.log("✅ تم إدخال إعدادات المنصة بنجاح.");

  console.log("✨ اكتملت عملية تعبئة البيانات بنجاح!");
}

main().catch((err) => {
  console.error("❌ فشل عملية تعبئة البيانات:", err);
  process.exit(1);
});