import { Droplets, FileText, Package, SprayCan, UtensilsCrossed } from "lucide-react";
import type { Product } from "@/lib/types";

/** Seeded/demo products use bundled SVG placeholders under /product-images. */
export function isPlaceholderImage(product: Pick<Product, "imageUrl">) {
  return !product.imageUrl || product.imageUrl.startsWith("/product-images/");
}

function categoryStyle(category: string) {
  const value = (category || "").toLowerCase();
  if (/clean|janitor|wipe|paper towel/.test(value)) return { Icon: SprayCan, tint: "bg-sky-50 text-atlas-blue" };
  if (/soap|hba|health|beauty|hygiene|personal/.test(value)) return { Icon: Droplets, tint: "bg-rose-50 text-rose-500" };
  if (/groc|pantry|food|snack|bever|candy|sauce/.test(value)) return { Icon: UtensilsCrossed, tint: "bg-amber-50 text-amber-600" };
  if (/paper|office|stationery/.test(value)) return { Icon: FileText, tint: "bg-emerald-50 text-emerald-600" };
  return { Icon: Package, tint: "bg-slate-100 text-slate-500" };
}

/**
 * Shows a real product photo when one exists, otherwise a clean
 * category-icon tile. Real images dropped into product.imageUrl
 * (e.g. a Supabase storage URL) render automatically.
 */
export function ProductImage({
  product,
  className = "",
  iconSize = 24
}: {
  product: Product;
  className?: string;
  iconSize?: number;
}) {
  if (!isPlaceholderImage(product)) {
    return <img alt={`${product.brand} ${product.description}`} className={`object-cover ${className}`} src={product.imageUrl} />;
  }
  const { Icon, tint } = categoryStyle(product.category);
  return (
    <span className={`flex items-center justify-center ${tint} ${className}`} role="img" aria-label={product.brand}>
      <Icon size={iconSize} />
    </span>
  );
}
