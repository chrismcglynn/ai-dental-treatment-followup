"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { label: "How it Works", href: "#how-it-works" },
  { label: "Integrations", href: "#integrations" },
  { label: "Pricing", href: "#pricing" },
  { label: "HIPAA Compliance", href: "#compliance" },
];

export function MarketingNav({ hideLinks }: { hideLinks?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const shouldHideLinks = hideLinks ?? ["/request-demo", "/privacy", "/hipaa"].includes(pathname);
  const shouldHideCta = pathname === "/request-demo";

  return (
    <header className="sticky top-0 z-50 bg-[var(--m-white)] border-b border-[var(--m-border)]">
      <nav className="mx-auto max-w-[1200px] flex items-center justify-between px-6 py-4">
        <Link href="/">
          <span
            className="text-3xl tracking-tight text-[--m-teal-mid]"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Retaine
          </span>
        </Link>

        {/* Desktop links */}
        {!shouldHideLinks && (
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[var(--m-slate)] hover:text-[var(--m-navy)] transition-colors"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        {/* Desktop CTA */}
        {!shouldHideCta && (
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/request-demo"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--m-teal-mid)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--m-teal)] transition-colors"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Request a Demo
            </Link>
          </div>
        )}

        {/* Mobile hamburger */}
        {(!shouldHideLinks || !shouldHideCta) && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button
                aria-label="Open menu"
                className="p-2 text-[var(--m-navy)]"
              >
                <Menu size={24} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-white p-6">
              <div className="flex flex-col gap-6 mt-8">
                {!shouldHideLinks &&
                  navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="text-base font-medium text-[var(--m-navy)]"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      {link.label}
                    </a>
                  ))}
                {!shouldHideLinks && !shouldHideCta && (
                  <hr className="border-[var(--m-border)]" />
                )}
                {!shouldHideCta && (
                  <Link
                    href="/request-demo"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-center rounded-lg bg-[var(--m-teal-mid)] px-4 py-2.5 text-sm font-semibold text-white"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    Request a Demo
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </nav>
    </header>
  );
}
