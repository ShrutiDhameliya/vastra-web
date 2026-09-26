export function AuthShell({ title, subtitle, children, footer }: {
    title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode;
}) {
    return (
        <div className="mx-auto flex w-full max-w-md flex-col px-4 py-16 sm:px-6">
            <h1 className="font-display text-3xl font-semibold">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-stone-500">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <p className="mt-6 text-center text-sm text-stone-500">{footer}</p>}
        </div>
    );
}

export function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</span>
            <input
                {...props}
                className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-ink"
            />
        </label>
    );
}