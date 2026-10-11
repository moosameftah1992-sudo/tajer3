export default async function StorePage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  return (
    <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
      <h1>مرحباً بك في المتجر: {slug}</h1>
      <p>منصة تاجر للمتاجر المتعددة تعمل بنجاح!</p>
    </div>
  );
}