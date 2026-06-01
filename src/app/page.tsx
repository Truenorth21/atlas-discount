import Link from "next/link";
import type { Route as NextRoute } from "next";
import { ArrowRight, Bot, CheckCircle2, ClipboardCheck, MapPinned, PackageSearch, Route, Truck, Users } from "lucide-react";
import { Nav } from "@/components/nav";

const stats = [
  ["Buyers get access", "Upload business documents, then see wholesale pricing"],
  ["Suppliers list products", "Upload products once approved by Atlas"],
  ["Atlas helps move orders", "Miami hub, Orlando hub, pickup, delivery, or freight"]
];

const steps = [
  ["01", "Apply", "Tell us if you are buying wholesale or supplying products."],
  ["02", "Upload documents", "Buyers upload resale/business documents. Suppliers upload W-9, insurance, and business documents."],
  ["03", "Atlas reviews", "Admin approves accounts, documents, and supplier products before they go live."],
  ["04", "Request or fulfill orders", "Buyers request quotes. Suppliers confirm inventory. Atlas helps route fulfillment."]
];

const paths = [
  {
    title: "I buy wholesale",
    body: "For stores, retailers, resellers, and business buyers who want approved wholesale products.",
    points: ["Upload resale certificate", "See wholesale pricing after approval", "Build a quote cart instead of paying upfront"],
    href: "/register/buyer" as NextRoute
  },
  {
    title: "I supply products",
    body: "For wholesalers, brands, importers, closeout suppliers, and distributors that want verified buyers.",
    points: ["Upload required supplier documents", "Submit product sheets", "Choose Miami, Orlando, or supplier-direct routing"],
    href: "/register/supplier" as NextRoute
  },
  {
    title: "I help move orders",
    body: "For route sellers and independent sellers who bring Atlas products to local business accounts.",
    points: ["Miami and Orlando territories", "Approved catalog access", "Account visits, reorders, and quote support"],
    href: "/register/route-seller" as NextRoute
  }
];

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <section className="bg-atlas-navy text-white">
          <div className="atlas-container grid min-h-[620px] content-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase text-sky-200">Wholesale buying • Supplier inventory • Florida fulfillment</p>
              <h1 className="mt-4 max-w-3xl text-5xl font-black tracking-normal sm:text-6xl">Atlas Discount</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
                Atlas connects approved business buyers with approved wholesale suppliers. Buyers request quotes,
                suppliers provide inventory, and Atlas helps route orders through Miami, Orlando, pickup, delivery, or freight.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link className="btn-primary bg-white text-atlas-navy hover:bg-slate-100" href="/register/buyer">
                  I want to buy wholesale
                  <ArrowRight size={16} />
                </Link>
                <Link className="btn-secondary border-white/30 bg-transparent text-white hover:border-white hover:text-white" href="/register/supplier">
                  I want to supply products
                </Link>
              </div>
            </div>
            <div className="grid gap-3">
              {stats.map(([title, body]) => (
                <div key={title} className="rounded-lg border border-white/15 bg-white/10 p-5">
                  <CheckCircle2 className="text-sky-200" />
                  <h2 className="mt-3 text-xl font-black">{title}</h2>
                  <p className="mt-1 text-slate-200">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="atlas-container grid gap-4 py-10 md:grid-cols-3">
          <div className="panel p-6">
            <PackageSearch className="text-atlas-blue" />
            <h2 className="mt-3 text-xl font-black">Searchable catalog</h2>
            <p className="mt-2 text-slate-600">Buyers search products by UPC, brand, category, hub, and location.</p>
          </div>
          <div className="panel p-6">
            <Truck className="text-atlas-blue" />
            <h2 className="mt-3 text-xl font-black">Fulfillment routing</h2>
            <p className="mt-2 text-slate-600">Each quote shows whether items move supplier-direct, through Miami, through Orlando, by pickup, delivery, or freight.</p>
          </div>
          <div className="panel p-6">
            <Users className="text-atlas-blue" />
            <h2 className="mt-3 text-xl font-black">Admin approval</h2>
            <p className="mt-2 text-slate-600">Atlas reviews buyers, suppliers, documents, products, and quotes before orders move forward.</p>
          </div>
        </section>
        <section className="border-y border-slate-200 bg-white py-12">
          <div className="atlas-container">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase text-atlas-blue">How Atlas Works</p>
              <h2 className="mt-2 text-3xl font-black text-atlas-navy">Simple flow: apply, get approved, request quotes.</h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {steps.map(([number, title, body]) => (
                <div key={number} className="rounded-lg border border-slate-200 bg-atlas-light p-5">
                  <span className="text-sm font-black text-atlas-blue">{number}</span>
                  <h3 className="mt-3 text-lg font-black text-atlas-navy">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="atlas-container grid gap-4 py-12 lg:grid-cols-3">
          {paths.map((path) => (
            <div key={path.title} className="panel p-6">
              <ClipboardCheck className="text-atlas-blue" />
              <h2 className="mt-3 text-xl font-black text-atlas-navy">{path.title}</h2>
              <p className="mt-2 text-slate-600">{path.body}</p>
              <ul className="mt-4 grid gap-2 text-sm text-slate-700">
                {path.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-atlas-blue" size={16} />
                    {point}
                  </li>
                ))}
              </ul>
              <Link className="btn-secondary mt-5" href={path.href}>
                Get started
                <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </section>
        <section className="bg-atlas-navy py-12 text-white">
          <div className="atlas-container grid gap-5 lg:grid-cols-3">
            <div className="rounded-lg border border-white/15 bg-white/10 p-6">
              <Bot className="text-sky-200" />
              <h2 className="mt-3 text-xl font-black">Atlas Assist</h2>
              <p className="mt-2 text-slate-200">
                Helpful reminders for missing documents, expiring documents, product upload issues, reorder prompts, and quote status.
              </p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 p-6">
              <MapPinned className="text-sky-200" />
              <h2 className="mt-3 text-xl font-black">Florida coverage</h2>
              <p className="mt-2 text-slate-200">
                Atlas starts with Miami and Orlando hubs, then routes orders across South Florida, Central Florida, Tampa, Jacksonville, and freight lanes.
              </p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 p-6">
              <Route className="text-sky-200" />
              <h2 className="mt-3 text-xl font-black">Route-aware quotes</h2>
              <p className="mt-2 text-slate-200">
                A quote can include multiple suppliers and routes, so buyers understand how the order will move before confirming.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
