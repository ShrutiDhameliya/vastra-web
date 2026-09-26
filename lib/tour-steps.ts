export type TourId = "customer" | "admin";

/** Snapshot taken once, when a tour starts — the overlay blocks interaction,
 *  so nothing here can change mid-tour. */
export type TourContext = {
    isLoggedIn: boolean;
    isAdmin: boolean;
    cartCount: number;
    isMobile: boolean;
};

export type TourStep = {
    /** Stable id — handy for logging/analytics. */
    id: string;
    title: string;
    body: string;
    /** CSS selector for the highlighted element. Omit for a centered step. */
    selector?: string;
    /** Navigate here first (client-side) if we're not already on this path. */
    path?: string;
    /** Include this step only when the predicate passes (evaluated at start). */
    when?: (ctx: TourContext) => boolean;
};

// ── The customer tour ────────────────────────────────────────
// Header steps have no `path` — the header is on every page.
// Responsive variants (nav/search/filters) swap via `when: c.isMobile`.
const CUSTOMER_STEPS: TourStep[] = [
    {
        id: "welcome",
        title: "Welcome to Vastra",
        body: "A two-minute walk through the shop — browsing, search, cart and checkout, and your account. Skip anytime; nothing changes either way.",
        path: "/",
    },
    {
        id: "nav-desktop",
        title: "Main navigation",
        body: "Jump straight to the full shop, the latest arrivals, or the current sale.",
        selector: '[data-tour="nav"]',
        when: (c) => !c.isMobile,
    },
    {
        id: "nav-mobile",
        title: "The menu",
        body: "Everything lives in here — the shop, new arrivals, the sale, search, and your account.",
        selector: '[data-tour="menu-btn"]',
        when: (c) => c.isMobile,
    },
    {
        id: "logo",
        title: "Home",
        body: "Tap the logo from anywhere on the site to come back to the homepage.",
        selector: '[data-tour="logo"]',
    },
    {
        id: "search",
        title: "Search",
        body: "Find products by name, brand, or category. Results land on the shop page, where you can refine further with filters.",
        selector: '[data-tour="search"]',
        when: (c) => !c.isMobile, // on mobile, search lives inside the menu
    },
    {
        id: "wishlist-icon",
        title: "Wishlist",
        body: "Tap the heart on any product to save it here. Signed in, your wishlist follows you across devices.",
        selector: '[data-tour="wishlist-icon"]',
    },
    {
        id: "cart-icon",
        title: "Cart",
        body: "Everything you add to the cart lands here — the badge shows how many items you're carrying.",
        selector: '[data-tour="cart-icon"]',
    },
    {
        id: "account-icon",
        title: "Your account",
        body: "Sign in or create an account to track orders, save addresses, and check out faster. Guest checkout works too.",
        selector: '[data-tour="account-icon"]',
    },
    {
        id: "hero",
        title: "The homepage",
        body: "New collections and current offers, front and centre.",
        selector: '[data-tour="hero"]',
        path: "/",
    },
    {
        id: "categories",
        title: "Categories",
        body: "Browse by department — Men, Women, Shoes, and Accessories.",
        selector: '[data-tour="categories"]',
    },
    {
        id: "featured",
        title: "Featured products",
        body: "The product card: hover for a second image, the heart saves to your wishlist, and single-variant products add to cart in one tap.",
        selector: '[data-tour="featured"]',
    },
    {
        id: "newsletter",
        title: "Stay in the loop",
        body: "New arrivals and offers, one email at a time. Unsubscribe anytime.",
        selector: '[data-tour="newsletter"]',
    },
    {
        id: "shop-filters-desktop",
        title: "Filters",
        body: "Narrow the collection by category, price, size, colour, and rating. Filters live in the URL — every view can be shared or bookmarked.",
        selector: '[data-tour="filters"]',
        path: "/shop",
        when: (c) => !c.isMobile,
    },
    {
        id: "shop-filters-mobile",
        title: "Filters",
        body: "Narrow the collection by category, price, size, colour, and rating — results update behind the drawer.",
        selector: '[data-tour="filters-btn"]',
        path: "/shop",
        when: (c) => c.isMobile,
    },
    {
        id: "shop-sort",
        title: "Sorting",
        body: "Featured, newest, price, or top rated — your call.",
        selector: '[data-tour="sort"]',
    },
    {
        id: "shop-grid",
        title: "The collection",
        body: "Everything that matches your filters, paginated. Items on sale show their discount right on the card.",
        selector: '[data-tour="shop-grid"]',
    },
    {
        id: "product-card",
        title: "Product details",
        body: "Open any product for the full picture — a photo gallery with zoom, size and colour selection with live stock, reviews from verified buyers, and related items.",
        selector: '[data-tour="shop-grid"] article:first-of-type',
    },
    {
        id: "wishlist-page",
        title: "Your wishlist",
        body: "Everything you've hearted, ready to move into your cart.",
        selector: '[data-tour="wishlist-page"]',
        path: "/wishlist",
    },
    {
        id: "cart-page",
        title: "Your cart",
        body: "Adjust quantities, remove items, and apply coupons — WELCOME10 takes 10% off your first order over ₹999.",
        selector: '[data-tour="cart-page"]',
        path: "/cart",
    },
    {
        id: "checkout",
        title: "Checkout",
        body: "One page: delivery address, shipping speed, and payment — UPI, cards and wallets via Razorpay, or Cash on Delivery. The final total is always verified on the server.",
        selector: '[data-tour="checkout-btn"]',
        when: (c) => c.cartCount > 0, // the button only exists with a full cart
    },
    {
        id: "login",
        title: "Sign in",
        body: "Create an account to track orders, save addresses, and sync your wishlist. Or continue as a guest — checkout works either way.",
        selector: '[data-tour="auth-form"]',
        path: "/login",
        when: (c) => !c.isLoggedIn,
    },
    {
        id: "account-nav",
        title: "Your account",
        body: "Orders, saved addresses, and profile settings — including your password, changeable anytime.",
        selector: '[data-tour="account-nav"]',
        path: "/account",
        when: (c) => c.isLoggedIn,
    },
    {
        id: "orders",
        title: "Order history",
        body: "Every order with its live status. Open one for the step-by-step tracking timeline, from Confirmed to Delivered.",
        selector: '[data-tour="orders-page"]',
        path: "/account/orders",
        when: (c) => c.isLoggedIn,
    },
    {
        id: "finish",
        title: "That's the tour",
        body: "You're ready to shop. Restart it anytime — the link sits at the bottom of every page.",
    },
];

// ── The admin tour (started only from the admin area, which is server-gated) ──
const ADMIN_STEPS: TourStep[] = [
    {
        id: "admin-welcome",
        title: "The admin tour",
        body: "The four screens that run the store — the dashboard, orders, products, and categories. About a minute.",
        path: "/admin",
    },
    {
        id: "admin-stats",
        title: "The store at a glance",
        body: "Realized revenue (online payments plus delivered COD), total orders, customers, and live products.",
        selector: '[data-tour="admin-stats"]',
    },
    {
        id: "admin-chart",
        title: "Sales",
        body: "Gross daily sales for the last 30 days — hover any bar for that day's total. Recent orders, low stock, and top sellers sit alongside.",
        selector: '[data-tour="admin-chart"]',
    },
    {
        id: "admin-orders",
        title: "Orders",
        body: "Search or filter by status. Open any order to walk it forward — Confirmed, Packed, Shipped, Delivered. Cancelling restocks automatically; a delivered COD order is marked paid.",
        selector: '[data-tour="admin-orders"]',
        path: "/admin/orders",
    },
    {
        id: "admin-products",
        title: "Products",
        body: "Full product management — upload images, set variants with per-variant stock and price overrides, and archive instead of delete so order history stays intact.",
        selector: '[data-tour="admin-products"]',
        path: "/admin/products",
    },
    {
        id: "admin-categories",
        title: "Categories",
        body: "Departments and subcategories for the shop's sidebar. Categories with products must be emptied before they can be deleted.",
        selector: '[data-tour="admin-categories"]',
        path: "/admin/categories",
    },
    {
        id: "admin-finish",
        title: "That's the admin",
        body: "For the storefront experience, take the customer tour — the link is in the site footer.",
    },
];

export function buildTourSteps(tour: TourId, ctx: TourContext): TourStep[] {
    if (tour === "admin" && !ctx.isAdmin) return []; // defense in depth — see caveats
    const all = tour === "admin" ? ADMIN_STEPS : CUSTOMER_STEPS;
    return all.filter((s) => !s.when || s.when(ctx));
}