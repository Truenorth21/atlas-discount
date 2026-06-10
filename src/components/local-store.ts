"use client";

import { useEffect, useState } from "react";
import { defaultPricingSettings, documentRequirements, sampleApplications, sampleOrders, sampleProducts, sampleRouteSellers } from "@/lib/data";
import { loadAdminApplications, loadAdminOrders, loadPromotionSubmissions, loadSharedAtlasData, saveApplicationStatus, saveDocumentReview, saveOrderRequest, savePromotionSubmission, savePromotionSubmissionStatus, saveSharedPricingSettings, saveSharedProducts, saveSharedProductPromotion, saveSharedProductSpec, saveSharedProductStatus } from "@/lib/supabase/atlas-data";
import type { Application, CartLine, OrderRequest, PricingSettings, Product, ProductSpec, PromotionSubmission, QuoteAdjustment, RouteSeller } from "@/lib/types";

type Store = {
  applications: Application[];
  products: Product[];
  orders: OrderRequest[];
  routeSellers: RouteSeller[];
  pricingSettings: PricingSettings;
  quoteAdjustments: QuoteAdjustment[];
  promotionSubmissions: PromotionSubmission[];
  cart: CartLine[];
  documentsVerified: boolean;
  /** The signed-in buyer's pricing tier (drives catalog prices). Defaults to the reference tier. */
  currentTierId: string;
};

const initialStore: Store = {
  applications: sampleApplications,
  products: sampleProducts,
  orders: sampleOrders,
  routeSellers: sampleRouteSellers,
  pricingSettings: defaultPricingSettings,
  quoteAdjustments: [],
  promotionSubmissions: [],
  cart: [],
  documentsVerified: false,
  currentTierId: "retailer"
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
    promotionSubmissions: store.promotionSubmissions ?? [],
    currentTierId: store.currentTierId ?? "retailer",
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
    loadAdminApplications()
      .then((applications) => {
        if (!active || applications === undefined) return;
        setStore((current) => {
          const next = normalizeStore({ ...current, applications });
          writeStoredState(next);
          return next;
        });
      })
      .catch(() => {
        // Keep demo applications if Supabase is unavailable or RLS blocks the read.
      });
    loadAdminOrders()
      .then((orders) => {
        if (!active || orders === undefined) return;
        setStore((current) => {
          const next = normalizeStore({ ...current, orders });
          writeStoredState(next);
          return next;
        });
      })
      .catch(() => {
        // Keep demo orders if Supabase is unavailable or RLS blocks the read.
      });
    loadPromotionSubmissions()
      .then((submissions) => {
        if (!active || submissions === undefined) return;
        setStore((current) => {
          const next = { ...current, promotionSubmissions: submissions };
          writeStoredState(next);
          return next;
        });
      })
      .catch(() => {
        // Keep local submissions if Supabase is unavailable or RLS blocks the read.
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
    updateProductPromotion: (id: string, promotion: string) => {
      const value = promotion.trim() || undefined;
      void saveSharedProductPromotion(id, value);
      commit((current) => ({
        ...current,
        products: current.products.map((product) => (product.id === id ? { ...product, promotion: value } : product))
      }));
    },
    updateProductTierDiscounts: (id: string, tierDiscounts: Record<string, number>) => {
      commit((current) => ({
        ...current,
        products: current.products.map((product) => {
          if (product.id !== id) return product;
          const cleaned: Record<string, number> = {};
          for (const [tierId, pct] of Object.entries(tierDiscounts)) {
            if (typeof pct === "number" && !Number.isNaN(pct)) cleaned[tierId] = pct;
          }
          const nextSpec: ProductSpec = { ...(product.spec ?? {}), tierDiscounts: cleaned };
          void saveSharedProductSpec(id, nextSpec);
          return { ...product, spec: nextSpec };
        })
      }));
    },
    setCurrentTier: (tierId: string) => commit((current) => ({ ...current, currentTierId: tierId })),
    addPromotionSubmission: (submission: PromotionSubmission) => {
      void savePromotionSubmission(submission);
      commit((current) => ({ ...current, promotionSubmissions: [submission, ...current.promotionSubmissions] }));
    },
    updatePromotionSubmissionStatus: (id: string, status: PromotionSubmission["status"]) => {
      void savePromotionSubmissionStatus(id, status);
      commit((current) => ({
        ...current,
        promotionSubmissions: current.promotionSubmissions.map((item) => (item.id === id ? { ...item, status } : item))
      }));
    },
    updateApplicationStatus: (id: string, status: Application["status"]) => {
      void saveApplicationStatus(id, status);
      commit((current) => ({
        ...current,
        applications: current.applications.map((application) =>
          application.id === id ? { ...application, status } : application
        )
      }));
    },
    updateApplicationDocumentStatus: (
      applicationId: string,
      documentIdToUpdate: string,
      status: Application["documents"][number]["status"],
      rejectionReason?: string
    ) => {
      void saveDocumentReview(documentIdToUpdate, status, rejectionReason);
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
      }));
    },
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
    addOrder: (order: OrderRequest) => {
      void saveOrderRequest(order);
      commit((current) => ({ ...current, orders: [order, ...current.orders], cart: [] }));
    },
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
