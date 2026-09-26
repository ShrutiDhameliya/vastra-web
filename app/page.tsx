import { getHomeData } from "@/lib/queries";
import { Hero } from "@/components/home/Hero";
import { CategoryStrip } from "@/components/home/CategoryStrip";
import { ProductSection } from "@/components/home/ProductSection";
import { PromoBanner } from "@/components/home/PromoBanner";
import { Benefits } from "@/components/home/Benefits";
import { Reviews } from "@/components/home/Reviews";
import { Newsletter } from "@/components/home/Newsletter";

// Homepage can be up to a minute stale — still fast, always fresh enough.
// Product/shop pages will be fully dynamic.
export const revalidate = 60;

export default async function HomePage() {
  const { categories, featured, newArrivals } = await getHomeData();

  return (
    <>
      <Hero />
      <CategoryStrip categories={categories} />
      <ProductSection
        title="Featured Products"
        products={featured}
        viewAllHref="/shop"
      />
      <PromoBanner />
      <ProductSection
        title="New Arrivals"
        products={newArrivals}
        viewAllHref="/shop?sort=new"
      />
      <Benefits />
      <Reviews />
      <Newsletter />
    </>
  );
}