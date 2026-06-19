import { createClient } from "./browser";

/** Uploads a product image to the public `product-images` bucket and returns its
 *  public URL. Used by the single-product form and the bulk sheet preview. */
export async function uploadProductImage(file: File): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();
  if (!supabase) {
    return { error: "Image upload needs Supabase configured. Paste an image URL instead." };
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, "_");
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safeName}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    upsert: true,
    cacheControl: "3600"
  });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return { url: data.publicUrl };
}
