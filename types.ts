
/** The shape ProductCard needs — produced by lib/queries.ts */

export type CardProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;

  price: number; // paise
  mrp: number | null; // compare-at price, paise
  discountPercent: number;

  rating: number | null;
  reviewCount: number;

  images: { url: string; alt: string | null }[];

  inStock: boolean;

  // Only set when the product has exactly ONE variant — then the card
  // can add it directly. Multi-variant products link to the details
  // page instead (you can't add "a shirt" without choosing a size).
  defaultVariantId: string | null;
  defaultVariantLabel: string | null;
  maxQty: number;
};

export type ShopSort =
  | "featured"
  | "new"
  | "price-asc"
  | "price-desc"
  | "rating";

export type ParsedShopQuery = {
  q: string | null;
  categorySlug: string | null;

  sizes: string[];
  colors: string[];

  minPrice: number | null; // paise
  maxPrice: number | null; // paise

  rating: number | null; // 3 or 4

  saleOnly: boolean;

  sort: ShopSort;

  page: number;
};

export type ShopFacets = {
  categories: {
    slug: string;
    name: string;
    count: number;
    depth: number;
  }[];

  sizes: string[];
  colors: string[];
};

export type DetailProduct = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  brand: string | null;
  description: string;
  price: number;
  mrp: number | null;
  discountPercent: number;
  ratingAvg: number | null;
  reviewCount: number;
  category: { name: string; slug: string };
  images: { url: string; alt: string | null }[];
  variants: { id: string; color: string; size: string; stock: number; price: number | null }[];
  reviews: {
    id: string;
    rating: number;
    title: string | null;
    comment: string;
    createdAt: string;
    userName: string;
    verifiedPurchase: boolean;
  }[];
};

export type QuoteResponse = {
  lines: {
    variantId: string; name: string; imageUrl: string | null;
    color: string | null; size: string | null;
    unitPrice: number; quantity: number; lineTotal: number;
    stock: number; available: boolean;
  }[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  coupon: { code: string; applied: boolean; discount: number; reason: string | null } | null;
  problems: string[];
  freeShippingThreshold: number;
};

export type PlaceOrderResponse = {
  ok: true;
  orderNumber: string;
  total: number;
  paymentMethod: "RAZORPAY" | "COD";
  razorpay: { keyId: string; razorpayOrderId: string; amount: number } | null;
};