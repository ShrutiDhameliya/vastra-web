import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import { ProductGallery } from "@/components/product/ProductGallery";
import { BuyBox } from "@/components/product/BuyBox";
import { ReviewsSection } from "@/components/product/ReviewsSection";
import { ProductGrid } from "@/components/ProductGrid";
import { Stars } from "@/components/Stars";
import { getSessionUser } from "@/lib/session";
import { hasPurchasedProduct } from "@/lib/reviews";
import { ReviewForm } from "@/components/product/ReviewForm";
import { prisma } from "@/lib/db";

// Cache the page for 60s in production. Safe: stock shown here is display-only —
// the checkout transaction re-validates stock server-side before charging.
export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> }; // Next 14: drop the await/Promise

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description.slice(0, 155),
    openGraph: { images: product.images.slice(0, 1).map((i) => i.url) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const user = await getSessionUser();

  let canReview = false;
  let myReview: {
    rating: number;
    title: string | null;
    comment: string;
  } | null = null;

  if (user) {
    const [purchased, mine] = await Promise.all([
      hasPurchasedProduct(user.id, product.id),
      prisma.review.findUnique({
        where: {
          productId_userId: {
            productId: product.id,
            userId: user.id,
          },
        },
        select: {
          rating: true,
          title: true,
          comment: true,
        },
      }),
    ]);

    canReview = purchased;
    myReview = mine;
  }

  const related = await getRelatedProducts(product.categoryId, product.id);
  const inStock = product.variants.some((v) => v.stock > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => i.url),
    description: product.description,
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (product.price / 100).toFixed(2), // schema.org wants rupees, we store paise
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(product.reviewCount > 0 && product.ratingAvg != null
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.ratingAvg, reviewCount: product.reviewCount } }
      : {}),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="text-sm text-stone-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-ink">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/shop?category=${product.category.slug}`} className="hover:text-ink">
              {product.category.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="truncate text-ink">{product.name}</li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-14">
        <ProductGallery images={product.images} name={product.name} />

        <div className="lg:sticky lg:top-24 lg:self-start">
          {product.brand && (
            <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{product.brand}</p>
          )}
          <h1 className="mt-1 font-display text-3xl font-semibold leading-tight">{product.name}</h1>

          {product.reviewCount > 0 && product.ratingAvg != null ? (
            <a href="#reviews" className="mt-2 inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-ink">
              <Stars value={product.ratingAvg} />
              <span>{product.ratingAvg.toFixed(1)} ({product.reviewCount})</span>
            </a>
          ) : (
            <p className="mt-2 text-sm text-stone-500">No reviews yet</p>
          )}

          <BuyBox product={product} />

          <ul className="mt-8 space-y-3 border-t border-stone-200 pt-6 text-sm text-stone-600">
            <li className="flex gap-3">
              <Truck className="mt-0.5 size-4 shrink-0" />
              Free delivery on orders over ₹1,999 · 2–4 business days
            </li>
            <li className="flex gap-3">
              <RotateCcw className="mt-0.5 size-4 shrink-0" />
              7-day easy returns with doorstep pickup
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              Secure payments — UPI, cards, netbanking &amp; COD
            </li>
          </ul>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold">Product details</h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-stone-600">{product.description}</p>
      </section>

      <ReviewsSection
        ratingAvg={product.ratingAvg}
        reviewCount={product.reviewCount}
        reviews={product.reviews}
        form={
          <ReviewForm
            productId={product.id}
            slug={product.slug}
            canReview={canReview}
            initial={myReview}
          />
        }
      />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold">You may also like</h2>
          <div className="mt-6">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  );
}