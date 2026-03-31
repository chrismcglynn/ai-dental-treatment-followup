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
  const shouldHideLinks = hideLinks ?? pathname === "/request-demo";

  return (
    <header className="sticky top-0 z-50 bg-[var(--m-white)] border-b border-[var(--m-border)]">
      <nav className="mx-auto max-w-[1200px] flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            className="text-[var(--m-teal)]"
          >
            <path
              d="M14 2C10.5 2 8 4.5 7 7C6 9.5 6 12 7 14.5C8 17 10 19 12 21C13 22 13.5 23 14 25C14.5 23 15 22 16 21C18 19 20 17 21 14.5C22 12 22 9.5 21 7C20 4.5 17.5 2 14 2ZM11 11C10.4 11 10 10.6 10 10C10 9.4 10.4 9 11 9C11.6 9 12 9.4 12 10C12 10.6 11.6 11 11 11ZM17 11C16.4 11 16 10.6 16 10C16 9.4 16.4 9 17 9C17.6 9 18 9.4 18 10C18 10.6 17.6 11 17 11Z"
              fill="currentColor"
            />
          </svg>
          <span
            className="text-xl font-bold text-[var(--m-navy)]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            FollowDent
          </span>
        </Link>

        {!shouldHideLinks && (
          <>
            {/* Desktop links */}
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

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/request-demo"
                className="inline-flex items-center justify-center rounded-lg bg-[var(--m-teal)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--m-teal-mid)] transition-colors"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Request a Demo
              </Link>
            </div>

            {/* Mobile hamburger */}
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
                  {navLinks.map((link) => (
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
                  <hr className="border-[var(--m-border)]" />
                  <Link
                    href="/request-demo"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-center rounded-lg bg-[var(--m-teal)] px-4 py-2.5 text-sm font-semibold text-white"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    Request a Demo
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </>
        )}
      </nav>
    </header>
  );
}
