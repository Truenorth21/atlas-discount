"use client";

import Link from "next/link";
import type { Route as NextRoute } from "next";
import {
  ArrowRight,
  BadgePercent,
  Boxes,
  CheckCircle2,
  Search,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { useAtlasStore } from "@/components/local-store";
import { Nav } from "@/components/nav";
import { ProductImage } from "@/components/product-image";
import { PublicFooter } from "@/components/public-footer";
import { productCategories } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/lib/types";

const categoryPhotos = [
  "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1601599561213-832382fd07ba?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1584473457493-17c4c24290c8?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=1200&q=85",
];

const collectionPhotos = [
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=88",
  "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1600&q=88",
  "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1600&q=88",
];

const fallbackDeals = [
  { name: "Beverage variety packs", detail: "Case-ready inventory", image: categoryPhotos[2] },
  { name: "Store cleaning essentials", detail: "Volume pricing available", image: categoryPhotos[0] },
  { name: "Pantry and snack staples", detail: "Fast-moving assortments", image: categoryPhotos[4] },
  { name: "Foodservice supplies", detail: "Built for daily operations", image: categoryPhotos[1] },
];

export default function HomePage() {
  const { store } = useAtlasStore();
  const { language } = useI18n();
  const es = language === "es";
  const approved = store.products.filter((product) => product.status === "approved");
  const featured = [
    ...approved.filter((product) => product.placements?.homepageFeatured),
    ...approved,
  ]
    .filter((product, index, list) => list.findIndex((item) => item.id === product.id) === index)
    .slice(0, 8);
  const categories = productCategories.slice(0, 6);

  return (
    <main className="atlas-storefront min-h-screen bg-white text-[#142033]">
      <Nav />

      <section className="relative min-h-[590px] overflow-hidden bg-[#10253d]">
        <img
          src="https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=2200&q=90"
          alt="Wholesale warehouse inventory"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071b31]/95 via-[#071b31]/76 to-[#071b31]/25" />
        <div className="relative mx-auto flex min-h-[590px] max-w-7xl items-center px-5 py-16 md:px-8">
          <div className="max-w-3xl text-white">
            <div className="mb-6 inline-flex items-center gap-2 border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide backdrop-blur-sm">
              <Boxes size={16} />
              {es ? "Mayorista para negocios verificados" : "Wholesale for verified businesses"}
            </div>
            <h1 className="max-w-3xl text-5xl font-bold leading-[1.02] md:text-7xl">
              {es
                ? "Abastece tu negocio con productos que se venden."
                : "Stock your business with products that move."}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/82 md:text-xl">
              {es
                ? "Compra cajas, pallets y surtidos mixtos de proveedores aprobados, con recogida en Miami u Orlando y opciones de entrega."
                : "Buy cases, pallets, and mixed assortments from approved suppliers, with Miami or Orlando pickup and delivery options."}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 bg-[#d82832] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#b91f28]"
              >
                {es ? "Comprar catálogo" : "Shop the catalog"} <ArrowRight size={17} />
              </Link>
              <Link
                href="/register/buyer"
                className="inline-flex items-center gap-2 border border-white/55 bg-white/10 px-6 py-4 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-[#10253d]"
              >
                {es ? "Abrir cuenta mayorista" : "Open a wholesale account"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dfe5ea] bg-white">
        <div className="mx-auto grid max-w-7xl divide-y divide-[#dfe5ea] px-5 md:grid-cols-4 md:divide-x md:divide-y-0 md:px-8">
          {[
            [BadgePercent, es ? "Precios por volumen" : "Volume pricing", es ? "Mejores precios por caja y pallet" : "Better pricing by case and pallet"],
            [Truck, es ? "Fulfillment flexible" : "Flexible fulfillment", es ? "Recogida, entrega o flete" : "Pickup, delivery, or freight"],
            [CheckCircle2, es ? "Negocios verificados" : "Verified businesses", es ? "Compradores y proveedores aprobados" : "Approved buyers and suppliers"],
            [ShoppingCart, es ? "Pedidos mixtos" : "Mixed orders", es ? "Combina productos en una solicitud" : "Combine products in one request"],
          ].map(([Icon, title, copy]) => {
            const BenefitIcon = Icon as typeof BadgePercent;
            return (
              <div key={String(title)} className="flex gap-4 py-6 md:px-6">
                <BenefitIcon className="mt-1 shrink-0 text-[#c51f2a]" size={22} />
                <div>
                  <p className="font-bold">{String(title)}</p>
                  <p className="mt-1 text-sm text-[#647184]">{String(copy)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-[#f2f4f2] py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-8 flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#c51f2a]">
                {es ? "Compra por departamento" : "Shop by department"}
              </p>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">
                {es ? "Productos para operar y crecer" : "Products to operate and grow"}
              </h2>
            </div>
            <Link href="/catalog" className="hidden items-center gap-2 text-sm font-bold text-[#173b66] md:inline-flex">
              {es ? "Ver todo" : "View all"} <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid auto-rows-[210px] gap-4 md:grid-cols-4">
            {categories.map((category, index) => (
              <Link
                key={category}
                href={("/catalog?category=" + encodeURIComponent(category)) as NextRoute}
                className={
                  "group relative overflow-hidden bg-[#10253d] " +
                  (index === 0 ? "md:col-span-2 md:row-span-2" : index === 1 ? "md:col-span-2" : "")
                }
              >
                <img
                  src={categoryPhotos[index]}
                  alt={category}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
                  <h3 className={index === 0 ? "text-3xl font-bold" : "text-xl font-bold"}>{category}</h3>
                  <ArrowRight className="shrink-0 transition group-hover:translate-x-1" size={20} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#c51f2a]">
                {es ? "Inventario destacado" : "Featured inventory"}
              </p>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">
                {es ? "Listo para tu próximo pedido" : "Ready for your next order"}
              </h2>
            </div>
            <Link href="/catalog" className="hidden items-center gap-2 text-sm font-bold text-[#173b66] md:inline-flex">
              {es ? "Catálogo completo" : "Full catalog"} <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-px bg-[#dfe5ea] sm:grid-cols-2 lg:grid-cols-4">
            {featured.length > 0
              ? featured.slice(0, 4).map((product) => <StorefrontProduct key={product.id} product={product} es={es} />)
              : fallbackDeals.map((item) => (
                  <Link key={item.name} href="/catalog" className="group bg-white p-4">
                    <div className="aspect-[4/3] overflow-hidden bg-[#eef1f3]">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    </div>
                    <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#c51f2a]">
                      {es ? "Disponible al por mayor" : "Wholesale available"}
                    </p>
                    <h3 className="mt-2 text-lg font-bold">{item.name}</h3>
                    <p className="mt-1 text-sm text-[#6b7788]">{item.detail}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#173b66]">
                      {es ? "Ver producto" : "View product"} <ArrowRight size={15} />
                    </span>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eef1ed] py-16">
        <div className="mx-auto grid max-w-7xl overflow-hidden bg-[#0e2f50] md:grid-cols-[1.05fr_.95fr]">
          <div className="flex flex-col justify-center px-6 py-12 text-white md:px-12">
            <p className="text-xs font-bold uppercase tracking-wide text-[#ffcf4a]">
              {es ? "Circular de esta semana" : "This week’s circular"}
            </p>
            <h2 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">
              {es ? "Ofertas creadas para mover inventario." : "Deals built to move inventory."}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
              {es
                ? "Explora promociones seleccionadas, ahorros por volumen y productos destacados en una página fácil de comprar."
                : "Explore selected promotions, volume savings, and featured products in one easy-to-shop flyer."}
            </p>
            <Link href="/deals" className="mt-8 inline-flex w-fit items-center gap-2 bg-[#ffcf4a] px-6 py-4 text-sm font-bold text-[#10253d]">
              {es ? "Ver ofertas semanales" : "See weekly deals"} <ArrowRight size={17} />
            </Link>
          </div>
          <div className="relative min-h-[390px]">
            <img
              src={collectionPhotos[1]}
              alt="Weekly wholesale deals"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0e2f50]/35 to-transparent" />
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 md:grid-cols-3 md:px-8">
          {[
            {
              image: collectionPhotos[0],
              eyebrow: es ? "Para compradores" : "For buyers",
              title: es ? "Un pedido. Más opciones." : "One order. More options.",
              copy: es ? "Combina cajas de distintas categorías y solicita la ruta de fulfillment que necesitas." : "Combine cases across categories and request the fulfillment route you need.",
              href: "/register/buyer",
            },
            {
              image: collectionPhotos[2],
              eyebrow: es ? "Para proveedores" : "For suppliers",
              title: es ? "Llega a compradores verificados." : "Reach verified buyers.",
              copy: es ? "Presenta productos, actualiza inventario y participa en promociones." : "Submit products, update inventory, and participate in promotions.",
              href: "/register/supplier",
            },
            {
              image: categoryPhotos[5],
              eyebrow: es ? "Ventas locales" : "Local sales",
              title: es ? "Haz crecer una ruta." : "Grow a sales route.",
              copy: es ? "Lleva el catálogo Atlas a negocios locales con territorios organizados." : "Bring the Atlas catalog to local businesses with organized territories.",
              href: "/register/route-seller",
            },
          ].map((item) => (
            <Link key={item.title} href={item.href} className="group grid grid-rows-[230px_1fr] border border-[#dfe5ea] bg-white">
              <div className="overflow-hidden">
                <img src={item.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-[#c51f2a]">{item.eyebrow}</p>
                <h3 className="mt-2 text-2xl font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#637083]">{item.copy}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#173b66]">
                  {es ? "Comenzar" : "Get started"} <ArrowRight size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

function StorefrontProduct({ product, es }: { product: Product; es: boolean }) {
  return (
    <Link href={"/catalog?search=" + encodeURIComponent(product.productName)} className="group bg-white p-4">
      <div className="aspect-[4/3] overflow-hidden bg-[#eef1f3]">
        <ProductImage product={product} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#c51f2a]">{product.brand}</p>
      <h3 className="mt-2 line-clamp-2 text-lg font-bold">{product.productName}</h3>
      <p className="mt-1 text-sm text-[#6b7788]">
        {product.casePack} {es ? "unidades/caja" : "units/case"}
      </p>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#173b66]">
        {es ? "Ver producto" : "View product"} <ArrowRight size={15} />
      </span>
    </Link>
  );
}
