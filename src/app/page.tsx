"use client";

import Link from "next/link";
import type { Route as NextRoute } from "next";
import { ArrowRight, BadgePercent, Boxes, CheckCircle2, Search, ShoppingCart, Sparkles, Truck } from "lucide-react";
import { AtlasMark } from "@/components/atlas-logo";
import { useAtlasStore } from "@/components/local-store";
import { Nav } from "@/components/nav";
import { ProductImage } from "@/components/product-image";
import { productCategories } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/lib/types";

const categoryPhotos: Record<string, string> = {
  "Janitorial / Cleaning Supplies": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=85",
  "Grocery / Pantry": "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=900&q=85",
  "Health & Beauty (HBA)": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85",
  "Office / Paper": "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=85",
  "Foodservice / Disposables": "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=85",
  "Closeout / Special buys": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=85"
};

const collectionPhotos = [
  { title: "Fresh arrivals", body: "New products ready for your shelves", image: "https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&w=1100&q=85", href: "/catalog" },
  { title: "Case deals", body: "Mix fast-moving essentials by the case", image: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=1100&q=85", href: "/deals" },
  { title: "Pallet opportunities", body: "Lower per-case pricing for volume buys", image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1100&q=85", href: "/catalog" }
];

export default function HomePage() {
  const { t } = useI18n();
  const { store } = useAtlasStore();
  const approved = store.products.filter((product) => product.status === "approved");
  const featured = [...approved.filter((product) => product.placements?.homepageFeatured), ...approved]
    .filter((product, index, list) => list.findIndex((item) => item.id === product.id) === index)
    .slice(0, 8);

  return <>
    <Nav />
    <main className="bg-white">
      <section className="relative min-h-[590px] overflow-hidden bg-atlas-navy text-white">
        <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=90" alt="Modern wholesale warehouse ready for fulfillment" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-atlas-navy/70" />
        <div className="atlas-container relative flex min-h-[590px] items-center py-12">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold backdrop-blur-sm"><Sparkles size={15} />Wholesale marketplace for verified businesses</span>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[.98] sm:text-7xl">Products your customers want. Wholesale terms your business needs.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">Discover supplier inventory, build mixed-case orders, and choose pickup or delivery from one simple wholesale account.</p>
            <form action="/catalog" className="mt-8 flex max-w-2xl overflow-hidden rounded-lg bg-white p-1.5 shadow-2xl">
              <Search className="ml-4 self-center text-slate-400" size={21} />
              <input name="q" className="h-12 min-w-0 flex-1 border-0 bg-transparent px-3 text-atlas-navy outline-none" placeholder="Search products, brands, SKUs, or UPCs" aria-label="Search products" />
              <button className="rounded-md bg-atlas-blue px-5 text-sm font-bold text-white sm:px-8" type="submit">Search</button>
            </form>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/catalog" className="inline-flex min-h-12 items-center gap-2 rounded-md bg-white px-7 font-bold text-atlas-navy transition hover:bg-sky-50"><ShoppingCart size={18} />Browse marketplace</Link>
              <Link href="/register/buyer" className="inline-flex min-h-12 items-center gap-2 rounded-md border border-white/60 bg-white/10 px-7 font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-atlas-navy">Create free account<ArrowRight size={18} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="atlas-container grid sm:grid-cols-3">
          <Benefit icon={<Boxes />} title="One mixed order" body="Combine products from multiple categories." />
          <Benefit icon={<Truck />} title="Flexible fulfillment" body="Pickup, local delivery, or freight support." />
          <Benefit icon={<CheckCircle2 />} title="Business-only access" body="Verified buyers and approved suppliers." />
        </div>
      </section>

      <section className="atlas-container py-12 sm:py-16">
        <SectionHeading eyebrow="Explore the marketplace" title="Purchase by category" href="/catalog" linkLabel="View all products" />
        <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Object.entries(productCategories).map(([name, subs]) => <Link key={name} href={`/catalog?category=${encodeURIComponent(name)}` as NextRoute} className="group block">
            <div className="aspect-[4/5] overflow-hidden rounded-lg bg-slate-100"><img src={categoryPhotos[name]} alt={name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
            <h3 className="mt-3 text-sm font-bold leading-tight text-atlas-navy group-hover:text-atlas-blue">{name}</h3>
            <p className="mt-1 text-xs text-slate-500">{subs.length} departments</p>
          </Link>)}
        </div>
      </section>

      <section className="bg-atlas-light py-12 sm:py-16">
        <div className="atlas-container">
          <SectionHeading eyebrow="Curated for independent retail" title="Discover new opportunities" />
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {collectionPhotos.map((collection) => <Link key={collection.title} href={collection.href} className="group relative aspect-[5/4] overflow-hidden rounded-lg bg-atlas-navy">
              <img src={collection.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-atlas-navy/35" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white"><h3 className="text-2xl font-black">{collection.title}</h3><p className="mt-1 text-sm text-white/85">{collection.body}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-bold">Shop collection<ArrowRight size={16} /></span></div>
            </Link>)}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="atlas-container">
          <SectionHeading eyebrow="Popular right now" title="Products retailers are buying" href="/catalog" linkLabel="Shop all inventory" />
          {featured.length > 0 ? <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">{featured.slice(0, 4).map((product) => <ProductTile key={product.id} product={product} />)}</div> : <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4"><EditorialProduct image="https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=85" title="Pantry essentials" /><EditorialProduct image="https://images.unsplash.com/photo-1621939514649-280e2aa9454e?auto=format&fit=crop&w=700&q=85" title="Snacks and confectionery" /><EditorialProduct image="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=85" title="Store staples" /><EditorialProduct image="https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=700&q=85" title="Health and beauty" /></div>}
        </div>
      </section>

      <section className="bg-[#eaf3ff] py-12 sm:py-16">
        <div className="atlas-container grid gap-6 lg:grid-cols-[1fr_1.65fr] lg:items-stretch">
          <div className="flex flex-col justify-center rounded-lg bg-atlas-navy p-8 text-white sm:p-10">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold"><BadgePercent size={16} />Weekly promotions</span>
            <h2 className="mt-5 text-4xl font-black leading-tight">Fresh deals for better retail margins.</h2>
            <p className="mt-3 text-sm leading-6 text-white/75">Limited-time supplier promotions, new arrivals, and closeout inventory in one dedicated flyer.</p>
            <Link href="/deals" className="mt-6 inline-flex min-h-12 w-fit items-center gap-2 rounded-md bg-white px-6 font-bold text-atlas-navy">View weekly deals<ArrowRight size={18} /></Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {featured.slice(0, 4).map((product) => <DealTile key={product.id} product={product} />)}
            {!featured.length && <><EditorialProduct image="https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&w=650&q=85" title="Beverage deals" /><EditorialProduct image="https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&w=650&q=85" title="Grocery specials" /><EditorialProduct image="https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=650&q=85" title="Personal care" /><EditorialProduct image="https://images.unsplash.com/photo-1584473457493-17c4c24290c8?auto=format&fit=crop&w=650&q=85" title="Household essentials" /></>}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="atlas-container grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div><p className="text-xs font-bold uppercase tracking-wide text-atlas-red">Start buying wholesale</p><h2 className="mt-2 text-4xl font-black leading-tight text-atlas-navy">One account. Thousands of opportunities for your store.</h2><p className="mt-3 max-w-xl leading-7 text-slate-600">Apply once, verify your business, and return whenever you need to replenish shelves or discover your next strong seller.</p><Link href="/register/buyer" className="btn-primary mt-6">Create business account<ArrowRight size={18} /></Link></div>
          <div className="grid gap-3 sm:grid-cols-3"><Step number="01" title="Apply" body="Tell us about your business." /><Step number="02" title="Get verified" body="Upload resale documents." /><Step number="03" title="Start shopping" body="Build case or pallet orders." /></div>
        </div>
      </section>
    </main>
    <Footer />
  </>;
}

function SectionHeading({ eyebrow, title, href, linkLabel }: { eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-atlas-red">{eyebrow}</p><h2 className="mt-2 text-3xl font-black text-atlas-navy sm:text-4xl">{title}</h2></div>{href && <Link href={href} className="inline-flex items-center gap-2 text-sm font-bold text-atlas-blue">{linkLabel}<ArrowRight size={17} /></Link>}</div>;
}
function Benefit({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return <div className="flex gap-4 border-b border-slate-200 py-6 last:border-0 sm:border-b-0 sm:border-r sm:px-7 sm:first:pl-0"><span className="text-atlas-blue">{icon}</span><div><p className="font-bold text-atlas-navy">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{body}</p></div></div>;
}
function Step({ number, title, body }: { number: string; title: string; body: string }) {
  return <div className="rounded-lg border border-slate-200 bg-atlas-light p-5"><span className="text-sm font-black text-atlas-blue">{number}</span><h3 className="mt-4 font-bold text-atlas-navy">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{body}</p></div>;
}
function DealTile({ product }: { product: Product }) {
  const { t } = useI18n();
  return <Link href={`/catalog?q=${encodeURIComponent(product.sku || product.brand)}` as NextRoute} className="group flex min-h-72 flex-col rounded-lg bg-white p-3 shadow-sm"><div className="aspect-square overflow-hidden rounded-md bg-slate-50"><ProductImage product={product} className="h-full w-full transition duration-300 group-hover:scale-105" iconSize={34} /></div><p className="mt-3 text-[10px] font-bold uppercase text-slate-400">{product.brand}</p><p className="line-clamp-2 text-sm font-bold text-atlas-navy">{product.productName || product.description}</p><p className="mt-auto pt-3 text-sm font-bold text-atlas-blue">{t("memberPricing")} →</p></Link>;
}
function ProductTile({ product }: { product: Product }) {
  const { t } = useI18n();
  return <Link href={`/catalog?q=${encodeURIComponent(product.sku || product.brand)}` as NextRoute} className="group flex min-h-[350px] flex-col rounded-lg border border-slate-200 bg-white p-3 transition hover:border-atlas-blue hover:shadow-panel"><div className="aspect-square overflow-hidden rounded-md bg-slate-50"><ProductImage product={product} className="h-full w-full transition duration-300 group-hover:scale-105" iconSize={38} /></div><p className="mt-3 text-[10px] font-bold uppercase text-slate-400">{product.brand}</p><p className="line-clamp-2 font-bold text-atlas-navy">{product.productName || product.description}</p><p className="mt-1 text-xs text-slate-500">Case pack: {product.casePack}</p><p className="mt-auto pt-3 text-sm font-bold text-atlas-blue">{t("memberPricing")} →</p></Link>;
}
function EditorialProduct({ image, title }: { image: string; title: string }) {
  return <Link href="/catalog" className="group flex min-h-[300px] flex-col rounded-lg border border-slate-200 bg-white p-3 transition hover:shadow-panel"><div className="aspect-square overflow-hidden rounded-md bg-slate-50"><img src={image} alt={title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /></div><p className="mt-3 font-bold text-atlas-navy">{title}</p><p className="mt-auto pt-2 text-sm font-bold text-atlas-blue">Browse products →</p></Link>;
}
function Footer() {
  const { t } = useI18n();
  return <footer className="bg-atlas-navy text-white"><div className="atlas-container grid gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr]"><div><AtlasMark tone="light" /><p className="mt-4 max-w-sm text-sm leading-6 text-white/65">{t("brandSubline")}</p></div><div><p className="text-xs font-bold uppercase text-white/40">{t("footerShop")}</p><Link href="/catalog" className="mt-3 block text-sm font-bold">{t("catalog")}</Link><Link href="/deals" className="mt-2 block text-sm font-bold">{t("weeklyDeals")}</Link></div><div><p className="text-xs font-bold uppercase text-white/40">{t("footerJoin")}</p><Link href="/login" className="mt-3 block text-sm font-bold">{t("signIn")}</Link></div></div><div className="border-t border-white/10"><div className="atlas-container py-5 text-xs text-white/45">{t("footerRights")}</div></div></footer>;
}
