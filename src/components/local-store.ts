"use client";

import { useEffect, useState } from "react";
import { defaultPricingSettings, documentRequirements, sampleApplications, sampleOrders, sampleProducts, sampleRouteSellers } from "@/lib/data";
import { loadSharedAtlasData, saveSharedPricingSettings, saveSharedProducts, saveSharedProductStatus } from "@/lib/supabase/atlas-data";
import type { Application, CartLine, OrderRequest, PricingSettings, Product, QuoteAdjustment, RouteSeller } from "@/lib/types";

type Store = {
  applications: Application[];
  products: Product[];
  orders: OrderRequest[];
  routeSellers: RouteSeller[];
  pricingSettings: PricingSettings;
  quoteAdjustments: QuoteAdjustment[];
  cart: CartLine[];
  documentsVerified: boolean;
};

const initialStore: Store = {
  applications: sampleApplications,
  products: sampleProducts,
  orders: sampleOrders,
  routeSellers: sampleRouteSellers,
  pricingSettings: defaultPricingSettings,
  quoteAdjustments: [],
  cart: [],
  documentsVerified: false
};

const key = "atlas-discount-store";
const windowNamePrefix = "atlas-discount-store:";

function documentId(type: Application["type"], label: string) {
  return `${type}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

function normalizeApplications(applications: Application[]) {
  return applications.map((application) => {
    const documents = Array.isArray(application.documents)
      ? application.documents
      : [];
    const normalizedDocuments =
      documents.length > 0 && typeof documents[0] === "string"
        ? documentRequirements[application.type].map((label) => {
            const fileName = (documents as unknown as string[]).find((name) =>
              name.toLowerCase().includes(label.split(" ")[0].toLowerCase())
            );
            return {
              id: documentId(application.type, label),
              label,
              fileName,
              expiresAt: undefined,
              status: fileName ? ("uploaded" as const) : ("needed" as const)
            };
          })
        : documents;

    return { ...application, documents: normalizedDocuments };
  });
}

function normalizeOrders(orders: OrderRequest[]) {
  return orders.map((order) => {
    const sampleOrder = sampleOrders.find((item) => item.id === order.id);
    return {
      ...order,
      lineItems: order.lineItems && order.lineItems.length > 0 ? order.lineItems : sampleOrder?.lineItems
    };
  });
}

function normalizeProducts(products: Product[]) {
  return products.map((product) => ({
    ...product,
    productName: product.productName ?? product.description,
    unitSize: product.unitSize ?? "",
    pickupLocation: product.pickupLocation ?? product.location,
    shippingLocation: product.shippingLocation ?? product.location,
    deliveryRadius: product.deliveryRadius ?? ""
  }));
}

function normalizeStore(store: Store): Store {
  const legacySettings = store.pricingSettings as PricingSettings & {
    defaultMarkupPercent?: number;
    minimumMarginPerCase?: number;
  };

  return {
    ...store,
    applications: normalizeApplications(store.applications),
    products: normalizeProducts(store.products),
    orders: normalizeOrders(store.orders),
    quoteAdjustments: store.quoteAdjustments ?? [],
    pricingSettings: {
      ...defaultPricingSettings,
      ...(store.pricingSettings ?? {}),
      supplierDirectFeePercent:
        legacySettings.supplierDirectFeePercent ?? defaultPricingSettings.supplierDirectFeePercent,
      supplierDirectMinimumFee:
        legacySettings.supplierDirectMinimumFee ?? defaultPricingSettings.supplierDirectMinimumFee,
      caseMarkupPercent: legacySettings.caseMarkupPercent ?? legacySettings.defaultMarkupPercent ?? defaultPricingSettings.caseMarkupPercent,
      minimumCaseMarginPerCase:
        legacySettings.minimumCaseMarginPerCase ?? legacySettings.minimumMarginPerCase ?? defaultPricingSettings.minimumCaseMarginPerCase
    }
  };
}

function readStoredState() {
  try {
    return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
  } catch {
    return window.name.startsWith(windowNamePrefix) ? window.name.slice(windowNamePrefix.length) : null;
  }
}

function writeStoredState(store: Store) {
  const value = JSON.stringify(store);
  try {
    window.localStorage.setItem(key, value);
    return;
  } catch {
    try {
      window.sessionStorage.setItem(key, value);
      return;
    } catch {
      window.name = `${windowNamePrefix}${value}`;
    }
  }
}

export function useAtlasStore() {
  const [store, setStore] = useState<Store>(initialStore);
  const [ready, setReady] = useState(false);

  function commit(update: Store | ((current: Store) => Store)) {
    setStore((current) => {
      const next = typeof update === "function" ? update(current) : update;
      writeStoredState(next);
      return next;
    });
  }

  useEffect(() => {
    let active = true;
    const saved = readStoredState();
    if (saved) {
      setStore(normalizeStore(JSON.parse(saved) as Store));
    }
    loadSharedAtlasData()
      .then((shared) => {
        if (!active) return;
        if (!shared.products && !shared.pricingSettings) return;

        setStore((current) => {
          const next = normalizeStore({
            ...current,
            products: shared.products && shared.products.length > 0 ? shared.products : current.products,
            pricingSettings: shared.pricingSettings ?? current.pricingSettings
          });
          writeStoredState(next);
          return next;
        });
      })
      .catch(() => {
        // Keep the local demo data if Supabase is unavailable or the user cannot read a table yet.
      });
    setReady(true);

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (ready) {
      writeStoredState(store);
    }
  }, [ready, store]);

  return {
    store,
    setStore: commit,
    ready,
    addApplication: (application: Application) =>
      commit((current) => ({ ...current, applications: [application, ...current.applications] })),
    addProducts: (products: Product[]) => {
      void saveSharedProducts(products);
      commit((current) => ({ ...current, products: [...products, ...current.products] }));
    },
    updateProductStatus: (id: string, status: Product["status"]) => {
      void saveSharedProductStatus(id, status);
      commit((current) => ({
        ...current,
        products: current.products.map((product) => (product.id === id ? { ...product, status } : product))
      }));
    },
    updateApplicationStatus: (id: string, status: Application["status"]) =>
      commit((current) => ({
        ...current,
        applications: current.applications.map((application) =>
          application.id === id ? { ...application, status } : application
        )
      })),
    updateApplicationDocumentStatus: (
      applicationId: string,
      documentIdToUpdate: string,
      status: Application["documents"][number]["status"],
      rejectionReason?: string
    ) =>
      commit((current) => ({
        ...current,
        applications: current.applications.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                documents: application.documents.map((document) =>
                  document.id === documentIdToUpdate
                    ? {
                        ...document,
                        status,
                        rejectionReason: status === "rejected" ? rejectionReason : undefined
                      }
                    : document
                )
              }
            : application
        )
      })),
    addToCart: (product: Product, quantity = 1) =>
      commit((current) => {
        const existing = current.cart.find((line) => line.product.id === product.id);
        const cart = existing
          ? current.cart.map((line) =>
              line.product.id === product.id ? { ...line, quantity: line.quantity + quantity } : line
            )
          : [...current.cart, { product, quantity }];
        return { ...current, cart };
      }),
    updateCartQuantity: (productId: string, quantity: number) =>
      commit((current) => ({
        ...current,
        cart: current.cart.map((line) =>
          line.product.id === productId
            ? { ...line, quantity: Math.max(1, Math.min(quantity, line.product.inventoryAvailable)) }
            : line
        )
      })),
    removeFromCart: (productId: string) =>
      commit((current) => ({
        ...current,
        cart: current.cart.filter((line) => line.product.id !== productId)
      })),
    setCart: (cart: CartLine[]) => commit((current) => ({ ...current, cart })),
    addOrder: (order: OrderRequest) =>
      commit((current) => ({ ...current, orders: [order, ...current.orders], cart: [] })),
    updatePricingSettings: (pricingSettings: PricingSettings) => {
      void saveSharedPricingSettings(pricingSettings);
      commit((current) => ({ ...current, pricingSettings }));
    },
    updateQuoteAdjustment: (orderId: string, adjustment: Omit<QuoteAdjustment, "orderId">) =>
      commit((current) => {
        const existing = current.quoteAdjustments.find((item) => item.orderId === orderId);
        const nextAdjustment = { ...(existing ?? { orderId }), ...adjustment };
        return {
          ...current,
          quoteAdjustments: existing
            ? current.quoteAdjustments.map((item) => (item.orderId === orderId ? nextAdjustment : item))
            : [...current.quoteAdjustments, nextAdjustment]
        };
      }),
    verifyDocuments: () => commit((current) => ({ ...current, documentsVerified: true }))
  };
}
