"use client";

import { useEffect } from "react";

/** Keeps the shared navigation and homepage circular pointed at the dedicated
 * flyer without changing product-search links elsewhere in the catalog. */
export function DealsLinkRouter() {
  useEffect(() => {
    const routeDeals = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor || anchor.getAttribute("href") !== "/catalog") return;

      const isPrimaryDealsLink = anchor.matches("nav a[href='/catalog']");
      const isHomepageCircular = Boolean(anchor.closest("main.bg-white > section.bg-atlas-light"));
      if (!isPrimaryDealsLink && !isHomepageCircular) return;

      event.preventDefault();
      window.location.assign("/deals");
    };

    document.addEventListener("click", routeDeals);
    return () => document.removeEventListener("click", routeDeals);
  }, []);

  return null;
}
