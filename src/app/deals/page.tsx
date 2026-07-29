"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgePercent, CalendarDays, PackageCheck } from "lucide-react";
import { useAtlasStore } from "@/components/local-store";
import { Nav } from "@/components/nav";
import { ProductImage } from "@/components/product-image";
import { PublicFooter } from "@/components/public-footer";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/lib/types";

const fallbackItems = [
  {
    name: "Cleaning supply case deal",
    brand: "Operations essential",
    detail: "Volume savings on case quantities",
    image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=1000&q=85",
  },
  {
    name: "Beverage assortment",
    brand: "Fast-moving inventory",
    detail: "Mixed flavors, case packed",
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1000&q=85",
  },
  {
    name: "Pantry staples",
    brand: "Retail ready",
    detail: "Stock-up pricing available",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=85",
  },
  {
    name: "Foodservice essentials",
    brand: "Business supply",
    detail: "Built for daily volume",
    image: "https://images.unsplash.com/photo-1601599561213-832382fd07ba?auto=format&fit=crop&w=1000&q=85",
  },
  {
    name: "Warehouse closeout",
    brand: "Limited quantity",
    detail: "Request current availability",
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1000&q=85",
  },
  {
    name: "Convenience store mix",
    brand: "Buyer favorite",
    detail: "Multiple categories, one request",
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1000&q=85",
  },
];

export default function DealsPage() {
  const { store } = useAtlasStore();
  const { language } = useI18n();
  const es = language === "es";
  const promoted = store.products
    .filter((product) => product.status === "approved" && (product.promotion?.status === "approved" || product.placements?.weeklyDeals))
    .slice(0, 12);
  const date = new Intl.DateTimeFormat(es ? "es-US" : "en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <main className="atlas-deals min-h-screen bg-[#eef1ed] text-[#142033]">
      <Nav />

      <section className="relative overflow-hidden bg-[#0e2f50] text-white">
        <img
          src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=2200&q=90"
          alt="Wholesale weekly specials"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071b31]/95 via-[#0e2f50]/82 to-[#0e2f50]/30" />
        <div className="relative mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-white/75 hover:text-white">
            <ArrowLeft size={16} /> {es ? "Volver al inicio" : "Back to home"}
          </Link>
          <div className="mt-12 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#ffcf4a] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#10253d]">
              <BadgePercent size={16} />
              {es ? "Circular de ofertas" : "Deals circular"}
            </div>
            <h1 className="mt-5 text-5xl font-bold leading-none md:text-7xl">
              {es ? "Ofertas de la semana" : "This week’s deals"}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/78">
              {es
                ? "Promociones mayoristas, ahorros por volumen y oportunidades de inventario seleccionadas para compradores verificados."
                : "Wholesale promotions, volume savings, and selected inventory opportunities for verified business buyers."}
            </p>
            <div className="mt-7 flex flex-wrap gap-5 text-sm font-semibold text-white/75">
              <span className="inline-flex items-center gap-2"><CalendarDays size={17} /> {date}</span>
              <span className="inline-flex items-center gap-2"><PackageCheck size={17} /> {es ? "Sujeto a disponibilidad" : "Subject to availability"}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-4 border-[#142033] pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#c51f2a]">
              {es ? "Especiales seleccionados" : "Selected specials"}
            </p>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">
              {es ? "Compra el flyer" : "Shop the flyer"}
            </h2>
          </div>
          <Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-bold text-[#173b66]">
            {es ? "Ver catálogo completo" : "View full catalog"} <ArrowRight size={16} />
          </Link>
        </div>

        {promoted.length > 0 ? (
          <div className="grid gap-px bg-[#cfd6db] sm:grid-cols-2 lg:grid-cols-3">
            {promoted.map((product, index) => (
              <DealProduct key={product.id} product={product} es={es} featured={index === 0} />
            ))}
          </div>
        ) : (
          <div className="grid gap-px bg-[#cfd6db] sm:grid-cols-2 lg:grid-cols-3">
            {fallbackItems.map((item, index) => (
              <Link
                key={item.name}
                href="/catalog"
                className={"group bg-white " + (index === 0 ? "sm:col-span-2 lg:grid lg:grid-cols-2" : "")}
              >
                <div className={"overflow-hidden bg-[#e6e9ea] " + (index === 0 ? "min-h-[300px]" : "aspect-[4/3]")}>
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#c51f2a]">{item.brand}</p>
                  <h3 className={"mt-2 font-bold " + (index === 0 ? "text-3xl" : "text-xl")}>{item.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#637083]">{item.detail}</p>
                  <span className="mt-6 inline-flex items-center gap-2 bg-[#142033] px-4 py-3 text-sm font-bold text-white">
                    {es ? "Comprar oferta" : "Shop deal"} <ArrowRight size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-[#ffcf4a]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-10 md:flex-row md:items-center md:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#8f1a22]">
              {es ? "¿Aún no eres miembro?" : "Not a member yet?"}
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#10253d]">
              {es ? "Desbloquea precios mayoristas." : "Unlock wholesale pricing."}
            </h2>
          </div>
          <Link href="/register/buyer" className="inline-flex items-center gap-2 bg-[#c51f2a] px-6 py-4 text-sm font-bold text-white">
            {es ? "Abrir una cuenta" : "Open an account"} <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

function DealProduct({ product, es, featured }: { product: Product; es: boolean; featured: boolean }) {
  return (
    <Link
      href={"/catalog?search=" + encodeURIComponent(product.productName)}
      className={"group bg-white " + (featured ? "sm:col-span-2 lg:grid lg:grid-cols-2" : "")}
    >
      <div className={"overflow-hidden bg-[#e6e9ea] " + (featured ? "min-h-[320px]" : "aspect-[4/3]")}>
        <ProductImage product={product} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-[#c51f2a]">{product.brand}</p>
        <h3 className={"mt-2 font-bold " + (featured ? "text-3xl" : "text-xl")}>{product.productName}</h3>
        <p className="mt-3 text-sm text-[#637083]">
          {product.casePack} {es ? "unidades por caja" : "units per case"}
        </p>
        <span className="mt-6 inline-flex items-center gap-2 bg-[#142033] px-4 py-3 text-sm font-bold text-white">
          {es ? "Ver oferta" : "View deal"} <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}
