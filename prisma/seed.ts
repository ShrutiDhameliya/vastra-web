
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const img = (seed: string) =>
  `https://picsum.photos/seed/${seed}/800/1000`;

function sizeVariants(skuBase: string, sizes: string[]) {
  return sizes.map((size) => ({
    sku: `${skuBase}-${size}`,
    color: "",
    size,
    stock: 10,
  }));
}

function colorSizeVariants(
  skuBase: string,
  colors: string[],
  sizes: string[]
) {
  return colors.flatMap((color) =>
    sizes.map((size) => ({
      sku: `${skuBase}-${color.slice(0, 3).toUpperCase()}-${size}`,
      color,
      size,
      stock: 8,
    }))
  );
}

async function main() {
  // --------------------------------------------------
  // 1. Delete old seed data
  // --------------------------------------------------

  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.orderEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // --------------------------------------------------
  // 2. Create categories
  // --------------------------------------------------

  const categories = await Promise.all(
    [
      {
        name: "Men",
        slug: "men",
        imageUrl: img("cat-men"),
      },
      {
        name: "Women",
        slug: "women",
        imageUrl: img("cat-women"),
      },
      {
        name: "Shoes",
        slug: "shoes",
        imageUrl: img("cat-shoes"),
      },
      {
        name: "Accessories",
        slug: "accessories",
        imageUrl: img("cat-accessories"),
      },
    ].map((c) => prisma.category.create({ data: c }))
  );

  const catId = Object.fromEntries(
    categories.map((c) => [c.slug, c.id])
  );

  // --------------------------------------------------
  // 3. Products
  //
  // IMPORTANT:
  // ratingAvg and reviewCount are NOT written here.
  // They will be calculated from real reviews below.
  // --------------------------------------------------

  const products = [
    {
      name: "Oxford Cotton Shirt",
      slug: "oxford-cotton-shirt",
      brand: "Vastra Essentials",
      description:
        "Breathable 100% cotton oxford with a soft-roll collar and mother-of-pearl buttons. Cut for a relaxed regular fit.",
      categorySlug: "men",
      price: 199900,
      mrp: 279900,
      isFeatured: true,
      images: [
        img("oxford-shirt-1"),
        img("oxford-shirt-2"),
      ],
      variants: sizeVariants("VE-OCS", ["S", "M", "L", "XL"]),
    },

    {
      name: "Merino Crew-Neck Sweater",
      slug: "merino-crew-sweater",
      brand: "Vastra Essentials",
      description:
        "Lightweight 12-gauge merino wool — warm without the bulk, machine washable.",
      categorySlug: "men",
      price: 349900,
      mrp: null,
      isFeatured: true,
      images: [
        img("merino-sweater-1"),
        img("merino-sweater-2"),
      ],
      variants: sizeVariants("VE-MCS", ["S", "M", "L", "XL"]),
    },

    {
      name: "Pleated Midi Dress",
      slug: "pleated-midi-dress",
      brand: "Vastra Studio",
      description:
        "Flowy pleated midi with an elastic waist — moves beautifully, packs even better.",
      categorySlug: "women",
      price: 289900,
      mrp: 359900,
      isFeatured: true,
      images: [
        img("midi-dress-1"),
        img("midi-dress-2"),
      ],
      variants: sizeVariants("VS-PMD", ["XS", "S", "M", "L"]),
    },

    {
      name: "High-Rise Straight Jeans",
      slug: "high-rise-straight-jeans",
      brand: "Vastra Denim",
      description:
        "Rigid 12oz denim in a high-rise straight cut, broken in from day one.",
      categorySlug: "women",
      price: 259900,
      mrp: 329900,
      isFeatured: true,
      images: [
        img("jeans-1"),
        img("jeans-2"),
      ],
      variants: sizeVariants("VD-HRJ", [
        "24",
        "26",
        "28",
        "30",
        "32",
      ]),
    },

    {
      name: "Relaxed Linen Shirt",
      slug: "relaxed-linen-shirt",
      brand: "Vastra Studio",
      description:
        "Garment-washed European flax linen, cut boxy through the body. Gets softer every wash.",
      categorySlug: "women",
      price: 229900,
      mrp: null,
      isFeatured: false,
      images: [
        img("linen-shirt-1"),
        img("linen-shirt-2"),
      ],
      variants: colorSizeVariants(
        "VS-RLS",
        ["Black", "White"],
        ["XS", "S", "M", "L"]
      ),
    },

    {
      name: "Court Classic Sneakers",
      slug: "court-classic-sneakers",
      brand: "Northline",
      description:
        "Minimal leather court sneakers on a cupsole — goes with everything, ages well.",
      categorySlug: "shoes",
      price: 399900,
      mrp: 499900,
      isFeatured: false,
      images: [
        img("sneakers-1"),
        img("sneakers-2"),
      ],
      variants: sizeVariants("NL-CCS", [
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
      ]),
    },

    {
      name: "Full-Grain Leather Belt",
      slug: "full-grain-leather-belt",
      brand: "Northline",
      description:
        "Vegetable-tanned full-grain leather with a solid brass buckle. One size, trim to fit.",
      categorySlug: "accessories",
      price: 149900,
      mrp: 199900,
      isFeatured: false,
      images: [
        img("leather-belt-1"),
      ],
      variants: [
        {
          sku: "NL-FGB-BRN",
          color: "Brown",
          size: "",
          stock: 32,
        },
      ],
    },

    {
      name: "Canvas Weekender Tote",
      slug: "canvas-weekender-tote",
      brand: "Northline",
      description:
        "Heavy 16oz waxed canvas with an interior zip pocket. Carry-on friendly.",
      categorySlug: "accessories",
      price: 189900,
      mrp: null,
      isFeatured: false,
      images: [
        img("canvas-tote-1"),
        img("canvas-tote-2"),
      ],
      variants: [
        {
          sku: "NL-CWT-OLV",
          color: "Olive",
          size: "",
          stock: 18,
        },
      ],
    },
  ];

  // --------------------------------------------------
  // 4. Create products and remember their IDs
  // --------------------------------------------------

  const created: { id: string; slug: string }[] = [];

  for (const [i, p] of products.entries()) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        brand: p.brand,
        price: p.price,
        mrp: p.mrp,

        discountPercent: p.mrp
          ? Math.round((1 - p.price / p.mrp) * 100)
          : 0,

        isFeatured: p.isFeatured,

        categoryId: catId[p.categorySlug],

        // Staggered so "New Arrivals" ordering is meaningful
        createdAt: new Date(
          Date.now() - (products.length - i) * 12 * 3600_000
        ),

        images: {
          create: p.images.map((url, j) => ({
            url,
            altText: `${p.name} — view ${j + 1}`,
            position: j,
          })),
        },

        variants: {
          create: p.variants,
        },
      },
    });

    // Save product ID and slug
    created.push({
      id: product.id,
      slug: product.slug,
    });
  }

  // --------------------------------------------------
  // 5. Create demo users
  // --------------------------------------------------

const users = await Promise.all(
  [
    {
      name: "Aisha Sharma",
      email: "aisha@example.com",
    },
    {
      name: "Rohan Mehta",
      email: "rohan@example.com",
    },
    {
      name: "Meera Iyer",
      email: "meera@example.com",
    },
    {
      name: "Kabir Singh",
      email: "kabir@example.com",
    },
    {
      name: "Zoya Khan",
      email: "zoya@example.com",
    },
    {
      name: "Aditya Rao",
      email: "aditya@example.com",
    },
  ].map((u) =>
    prisma.user.create({
      data: u,
    })
  )
);
  // --------------------------------------------------
  // 6. Reviews
  //
  // [userIndex, rating, title, comment, daysAgo]
  // --------------------------------------------------

  const REVIEWS: Record<
    string,
    [number, number, string, string, number][]
  > = {
    "oxford-cotton-shirt": [
      [
        0,
        5,
        "Wardrobe staple",
        "Soft, breathable, and the collar holds its shape after washes. True to size.",
        58,
      ],
      [
        1,
        5,
        "Excellent quality",
        "The buttons feel premium. Ordered M and the regular fit is spot on.",
        41,
      ],
      [
        2,
        4,
        "Slightly long sleeves",
        "Runs a touch long in the sleeve for me, otherwise love the fabric.",
        23,
      ],
      [
        4,
        5,
        "Third one I own",
        "That is the review. It is that good.",
        9,
      ],
    ],

    "merino-crew-sweater": [
      [
        3,
        5,
        "Warm without the weight",
        "Light but properly warm through a Delhi winter morning.",
        35,
      ],
      [
        0,
        4,
        "Nice knit — size up",
        "Snug at M if you plan to layer. Colour exactly as pictured.",
        27,
      ],
      [
        5,
        5,
        "No pilling so far",
        "Two months and two machine washes in — still looks new.",
        12,
      ],
    ],

    "pleated-midi-dress": [
      [
        2,
        5,
        "Beautiful drape",
        "The pleats fall really well and the elastic waist is comfortable all day.",
        44,
      ],
      [
        4,
        5,
        "Packs like a dream",
        "Took it on a work trip — zero wrinkles out of the bag.",
        30,
      ],
      [
        0,
        5,
        "Compliments guaranteed",
        "Ended up buying it in a second colour.",
        16,
      ],
      [
        1,
        4,
        "Slightly sheer in sun",
        "Fine with a slip underneath. Otherwise perfect.",
        5,
      ],
    ],

    "high-rise-straight-jeans": [
      [
        1,
        5,
        "Denim done right",
        "Rigid at first but breaks in fast. The size guide is accurate.",
        52,
      ],
      [
        3,
        4,
        "Great fit, long inseam",
        "Hemmed an inch — standard at my height.",
        38,
      ],
      [
        5,
        5,
        "Finally a proper high rise",
        "Sits at the natural waist with no gaping.",
        21,
      ],
      [
        2,
        4,
        "Good, want more washes",
        "Would buy again in a lighter wash.",
        11,
      ],
      [
        4,
        5,
        "Second pair",
        "Need I say more.",
        3,
      ],
    ],

    "relaxed-linen-shirt": [
      [
        0,
        4,
        "Lovely linen",
        "Wrinkles exactly as linen should. Boxy but flattering.",
        26,
      ],
      [
        5,
        5,
        "Perfect for Bombay humidity",
        "Airy, and the black has not faded.",
        14,
      ],
      [
        3,
        4,
        "Runs oversized",
        "Size down if you are between sizes.",
        6,
      ],
    ],

    "court-classic-sneakers": [
      [
        3,
        5,
        "Clean and comfy",
        "All week at work, no bite-in period.",
        33,
      ],
      [
        2,
        4,
        "Slightly narrow",
        "Wide feet — half a size up helps.",
        19,
      ],
      [
        1,
        5,
        "Goes with everything",
        "Now I notice how dirty all my other shoes are.",
        8,
      ],
    ],

    "full-grain-leather-belt": [
      [
        0,
        5,
        "Will outlive me",
        "Solid brass, thick leather. Trimmed to fit in a minute.",
        47,
      ],
      [
        4,
        5,
        "Great gift",
        "Bought it for my father, now ordering one for myself.",
        25,
      ],
      [
        5,
        4,
        "Stiff initially",
        "Softens up after a couple of weeks of wear.",
        13,
      ],
    ],

    "canvas-weekender-tote": [
      [
        5,
        4,
        "Solid everyday bag",
        "The zip pocket is exactly keys-plus-charger sized.",
        42,
      ],
      [
        2,
        4,
        "Held a week of clothes",
        "One cabin trip, one bag, done.",
        18,
      ],
      [
        1,
        5,
        "Rain-tested",
        "The waxed canvas shrugged off a Pune drizzle.",
        7,
      ],
    ],
  };

  // --------------------------------------------------
  // 7. Create reviews and calculate rating
  // --------------------------------------------------

  let totalReviews = 0;

  for (const [slug, list] of Object.entries(REVIEWS)) {
    const productId = created.find(
      (c) => c.slug === slug
    )?.id;

    if (!productId) continue;

    await prisma.review.createMany({
      data: list.map(
        ([u, rating, title, comment, days]) => ({
          productId,
          userId: users[u].id,
          rating,
          title,
          comment,
          isApproved: true,
          verifiedPurchase: true,

          createdAt: new Date(
            Date.now() - days * 24 * 3600_000
          ),
        })
      ),
    });

    // Calculate average rating from actual reviews
    const avg =
      list.reduce((sum, review) => sum + review[1], 0) /
      list.length;

    await prisma.product.update({
      where: {
        id: productId,
      },

      data: {
        ratingAvg: Math.round(avg * 10) / 10,
        reviewCount: list.length,
      },
    });

    totalReviews += list.length;
  }

  // --------------------------------------------------
  // 8. Coupon
  // --------------------------------------------------

  await prisma.coupon.create({
    data: {
      code: "WELCOME10",
      type: "PERCENT",
      value: 10,
      maxDiscount: 30000,
      minOrderAmount: 99900,
      perUserLimit: 1,
      startsAt: new Date(),
      expiresAt: new Date(
        Date.now() + 90 * 24 * 3600_000
      ),
    },
  });

  // --------------------------------------------------
  // 9. Final message
  // --------------------------------------------------

  console.log(
    `Seeded ${products.length} products, ${users.length} users, ${totalReviews} reviews.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
