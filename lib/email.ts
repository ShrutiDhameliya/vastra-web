import { prisma } from "./db";
import { formatPaise } from "./money";

const FROM = process.env.EMAIL_FROM ?? "Vastra <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n[dev email] to=${to} subject="${subject}"\n${html}\n`);
    return;
  }
  // Dynamic import keeps Resend out of the graph when email is disabled
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function sendOrderConfirmation(orderNumber: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) return;

  const rows = order.items
    .map(
      (it) => `<tr>
        <td style="padding:6px 0">${it.productName}${it.color ? ` (${it.color}${it.size ? ", " + it.size : ""})` : ""} × ${it.quantity}</td>
        <td style="padding:6px 0;text-align:right">${formatPaise(it.unitPrice * it.quantity)}</td>
      </tr>`
    )
    .join("");

  await sendEmail(
    order.email,
    `Your Vastra order ${order.orderNumber} is confirmed`,
    `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#1c1917">
      <h2 style="font-size:20px">Thank you for your order!</h2>
      <p>Order <strong>${order.orderNumber}</strong> is confirmed and being prepared.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
        <tr><td style="padding:6px 0;border-top:1px solid #e7e5e4">Shipping</td>
        <td style="padding:6px 0;border-top:1px solid #e7e5e4;text-align:right">${order.shippingFee ? formatPaise(order.shippingFee) : "Free"}</td></tr>
        ${order.discount ? `<tr><td style="padding:6px 0;color:#166534">Discount</td><td style="padding:6px 0;color:#166534;text-align:right">−${formatPaise(order.discount)}</td></tr>` : ""}
        <tr><td style="padding:6px 0;font-weight:700;border-top:1px solid #e7e5e4">Total</td>
        <td style="padding:6px 0;font-weight:700;border-top:1px solid #e7e5e4;text-align:right">${formatPaise(order.total)}</td></tr>
      </table>
      <p style="font-size:13px;color:#57534e">Track your order:
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/orders/${order.orderNumber}">${order.orderNumber}</a></p>
    </div>`
  );
}