import type { Product } from "@/lib/types";
import { stockImage } from "@/lib/data";

/** Bundled SVGs were early MVP illustrations. Treat them as placeholders so the
 * storefront uses photography until a supplier uploads the real pack shot. */
export function isPlaceholderImage(product: Pick<Product, "imageUrl">) {
  return !product.imageUrl || product.imageUrl.startsWith("/product-images/") || product.imageUrl.endsWith(".svg");
}

function photoQuery(product: Product) {
  const text = `${product.brand} ${product.productName || ""} ${product.description} ${product.category}`.toLowerCase();
  if (/hot sauce|sauce/.test(text)) return "hot sauce bottles grocery product";
  if (/energy drink|beverage|water|juice|soda/.test(text)) return "beverage bottles cans grocery product";
  if (/cookie|snack|candy/.test(text)) return "packaged cookies snacks grocery product";
  if (/clean|janitor|wipe|detergent|soap/.test(text)) return "cleaning supplies bottles product";
  if (/paper|towel|tissue|office/.test(text)) return "paper products wholesale package";
  if (/health|beauty|hygiene|personal/.test(text)) return "personal care products package";
  if (/food|grocery|pantry/.test(text)) return "packaged grocery food product";
  return "wholesale retail product package";
}

function stableLock(product: Product) {
  const value = `${product.sku}${product.upc}${product.brand}`;
  return Array.from(value).reduce((sum, character) => sum + character.charCodeAt(0), 0) % 900 + 100;
}

export function ProductImage({
  product,
  className = "",
  iconSize: _iconSize = 24
}: {
  product: Product;
  className?: string;
  iconSize?: number;
}) {
  const source = isPlaceholderImage(product)
    ? stockImage(photoQuery(product), 900, 900, stableLock(product))
    : product.imageUrl;

  return (
    <img
      alt={`${product.brand} ${product.productName || product.description}`}
      className={`bg-white object-contain p-2 ${className}`}
      src={source}
      loading="lazy"
    />
  );
}
