import { Headphones, RotateCcw, ShieldCheck, Truck } from "lucide-react";

const BENEFITS = [
  { icon: Truck, title: "Fast Delivery", text: "Free over ₹1,999 · 2–4 days pan-India" },
  { icon: ShieldCheck, title: "Secure Payment", text: "UPI, cards, netbanking & COD via Razorpay" },
  { icon: RotateCcw, title: "Easy Returns", text: "7-day returns with doorstep pickup" },
  { icon: Headphones, title: "Human Support", text: "Mon–Sat, 9 AM – 7 PM IST" },
];

export function Benefits() {
  return (
    <section className="border-y border-stone-200">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {BENEFITS.map((b) => (
          <div key={b.title} className="flex items-start gap-3">
            <b.icon className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="text-sm font-medium">{b.title}</p>
              <p className="text-xs text-stone-500">{b.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}