import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as dotenv from "dotenv";
import { themeCatalog, platformSettings, countries, governorates, areas, tenants } from "./schema";
import { THEMES } from "@/lib/themes";

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  console.log("🌱 جاري إدخال كافة البيانات الأساسية في قاعدة البيانات...");

  // 1. إدخال القوالب العشرين
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

  // 2. إدخال إعدادات المنصة
  await db.insert(platformSettings).values({
    id: "default",
    monthlyPrice: "15.000",
    yearlyPrice: "150.000",
    billingCurrency: "BHD",
    trialDays: 30,
    supportEmail: "support@tajer.com",
  }).onConflictDoNothing();
  console.log("✅ تم إدخال إعدادات المنصة بنجاح.");

  // 3. إدخال الدول (مثل البحرين والسعودية)
  await db.insert(countries).values([
    { id: "c_bh", code: "BH", nameEn: "Bahrain", nameAr: "البحرين", vatDefault: "10", active: true, sort: 1 },
    { id: "c_sa", code: "SA", nameEn: "Saudi Arabia", nameAr: "السعودية", vatDefault: "15", active: true, sort: 2 },
  ]).onConflictDoNothing();
  console.log("✅ تم إدخال الدول بنجاح.");

  // 4. إدخال المحافظات (لمملكة البحرين مثلاً)
  await db.insert(governorates).values([
    { id: "g_capital", countryId: "c_bh", nameEn: "Capital Governorate", nameAr: "محافظة العاصمة", active: true, sort: 1 },
    { id: "g_muharraq", countryId: "c_bh", nameEn: "Muharraq Governorate", nameAr: "محافظة المحرق", active: true, sort: 2 },
  ]).onConflictDoNothing();
  console.log("✅ تم إدخال المحافظات بنجاح.");

  // 5. إدخال المناطق
  await db.insert(areas).values([
    { id: "a_tubli", governorateId: "g_capital", nameEn: "Tubli", nameAr: "توبلي", active: true, sort: 1 },
    { id: "a_manama", governorateId: "g_capital", nameEn: "Manama", nameAr: "المنامة", active: true, sort: 2 },
  ]).onConflictDoNothing();
  console.log("✅ تم إدخال المناطق بنجاح.");

  // 6. إدخال متجر تجريبي مميز (Featured Tenant) لكي يظهر في الصفحة الرئيسية
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  await db.insert(tenants).values({
    id: "t_noor",
    slug: "noor",
    nameEn: "Noor Boutique",
    nameAr: "بوتيك نور",
    industry: "boutique",
    countryId: "c_bh",
    governorateId: "g_capital",
    currency: "BHD",
    themeId: "t01",
    themeConfig: {},
    featured: true,
    status: "active",
    plan: "trial",
    trialEndsAt: futureDate,
    subscriptionEndsAt: futureDate,
  }).onConflictDoNothing();
  console.log("✅ تم إدخال المتجر التجريبي المميز بنجاح.");

  console.log("✨ اكتملت عملية تعبئة كافة جداول قاعدة البيانات بنجاح!");
}

main().catch((err) => {
  console.error("❌ فشل عملية تعبئة البيانات:", err);
  process.exit(1);
});