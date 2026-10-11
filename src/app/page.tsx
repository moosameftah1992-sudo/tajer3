export default async function HomePage() {
  const locale = await getLocale();
  
  // قيم افتراضية مؤقتة لضمان عدم تجمد الصفحة إذا كانت قاعدة البيانات فارغة
  const settings = { trialDays: 30, monthlyPrice: "49", yearlyPrice: "470", billingCurrency: "USD" };
  const geo = [];
  const themes = [];
  const featured = [];
  const areas = 0;