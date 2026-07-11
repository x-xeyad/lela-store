import { mockProducts } from "../data/mockProducts";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

const PRODUCTS_KEY = "lela_products";

const mapProductFromDb = (p) => {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name || { en: "", ar: "" },
    description: p.description || { en: "", ar: "" },
    category: p.category,
    costEGP: parseFloat(p.cost_egp !== undefined ? p.cost_egp : p.costEGP || 0),
    profitEGP: parseFloat(p.profit_egp !== undefined ? p.profit_egp : p.profitEGP || 0),
    priceEGP: parseFloat(p.price_egp !== undefined ? p.price_egp : p.priceEGP || 0),
    weight: parseFloat(p.weight !== undefined ? p.weight : 0.5),
    images: p.images || [],
    featured: !!p.featured,
    sizes: p.sizes || [],
    colors: p.colors || [],
    variants: p.variants || [],
    stock: parseInt(p.stock !== undefined ? p.stock : 10, 10),
    status: p.status || "visible",
    tags: p.tags || [],
    rating: parseFloat(p.rating !== undefined ? p.rating : 5.0),
    reviewsCount: parseInt(p.reviews_count !== undefined ? p.reviews_count : p.reviewsCount || 0, 10),
    discountType: p.discount_type || "none",
    discountValue: parseFloat(p.discount_value !== undefined ? p.discount_value : 0)
  };
};

const mapProductToDb = (p) => {
  if (!p) return null;
  const mapped = {
    name: p.name,
    description: p.description,
    category: p.category,
    cost_egp: p.costEGP,
    profit_egp: p.profitEGP,
    price_egp: p.priceEGP,
    weight: p.weight,
    images: p.images,
    featured: p.featured,
    sizes: p.sizes,
    colors: p.colors,
    variants: p.variants,
    stock: p.stock,
    status: p.status,
    tags: p.tags,
    rating: p.rating,
    reviews_count: p.reviewsCount,
    discount_type: p.discountType || "none",
    discount_value: p.discountValue || 0
  };
  return mapped;
};

const initProducts = () => {
  const existing = localStorage.getItem(PRODUCTS_KEY);
  let productsList;
  if (!existing) {
    productsList = mockProducts;
  } else {
    try {
      productsList = JSON.parse(existing);
    } catch (e) {
      productsList = mockProducts;
    }
  }

  const enriched = productsList.map(p => {
    const cost = p.costEGP !== undefined ? p.costEGP : Math.round(p.priceEGP * 0.8);
    const profit = p.profitEGP !== undefined ? p.profitEGP : Math.round(p.priceEGP * 0.2);
    return {
      ...p,
      costEGP: cost,
      profitEGP: profit,
      priceEGP: cost + profit,
      stock: p.stock !== undefined ? p.stock : 10,
      status: p.status !== undefined ? p.status : "visible",
      tags: p.tags !== undefined ? p.tags : ["new"],
      images: p.images || [],
      variants: p.variants || [],
      discountType: p.discountType || "none",
      discountValue: p.discountValue || 0
    };
  });

  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(enriched));
  return enriched;
};

export const productService = {
  getAll: async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("id", { ascending: false });
        if (error) {
          console.error("Supabase getAll error:", error);
        } else if (data) {
          return data.map(mapProductFromDb);
        }
      } catch (err) {
        console.error("Supabase getAll connection issue:", err);
      }
    }
    return initProducts();
  },

  getById: async (id) => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();
        if (error) {
          console.error("Supabase getById error:", error);
        } else if (data) {
          return mapProductFromDb(data);
        }
      } catch (err) {
        console.error("Supabase getById connection issue:", err);
      }
    }
    const products = initProducts();
    return products.find(p => p.id === id) || null;
  },

  create: async (productData) => {
    const cost = parseFloat(productData.costEGP || 0);
    const profit = parseFloat(productData.profitEGP || 0);
    const payload = {
      ...productData,
      rating: parseFloat(productData.rating || 5.0),
      reviewsCount: parseInt(productData.reviewsCount || 0, 10),
      costEGP: cost,
      profitEGP: profit,
      priceEGP: cost + profit,
      weight: parseFloat(productData.weight || 0.5),
      stock: parseInt(productData.stock !== undefined ? productData.stock : 10, 10),
      status: productData.status || "visible",
      tags: productData.tags || [],
      images: productData.images || [],
      variants: productData.variants || [],
      discountType: productData.discountType || "none",
      discountValue: parseFloat(productData.discountValue || 0)
    };

    if (isSupabaseConfigured) {
      try {
        const dbPayload = mapProductToDb(payload);
        const { data, error } = await supabase
          .from("products")
          .insert([dbPayload])
          .select()
          .single();
        if (error) {
          console.error("Supabase create error:", error);
          throw error;
        }
        return mapProductFromDb(data);
      } catch (err) {
        console.error("Supabase create connection issue:", err);
      }
    }

    const products = initProducts();
    const newProduct = {
      ...payload,
      id: "p_" + Date.now(),
    };
    products.push(newProduct);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    return newProduct;
  },

  update: async (id, updatedData) => {
    if (isSupabaseConfigured) {
      try {
        const dbPayload = mapProductToDb(updatedData);
        // Remove undefined keys
        Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);
        const { data, error } = await supabase
          .from("products")
          .update(dbPayload)
          .eq("id", id)
          .select()
          .single();
        if (error) {
          console.error("Supabase update error:", error);
          throw error;
        }
        return mapProductFromDb(data);
      } catch (err) {
        console.error("Supabase update connection issue:", err);
      }
    }

    const products = initProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("Product not found");

    const cost = parseFloat(updatedData.costEGP !== undefined ? updatedData.costEGP : products[idx].costEGP);
    const profit = parseFloat(updatedData.profitEGP !== undefined ? updatedData.profitEGP : products[idx].profitEGP);

    products[idx] = {
      ...products[idx],
      ...updatedData,
      costEGP: cost,
      profitEGP: profit,
      priceEGP: cost + profit,
      weight: parseFloat(updatedData.weight !== undefined ? updatedData.weight : products[idx].weight),
      stock: parseInt(updatedData.stock !== undefined ? updatedData.stock : products[idx].stock, 10),
      status: updatedData.status || products[idx].status || "visible",
      tags: updatedData.tags || products[idx].tags || [],
      images: updatedData.images || products[idx].images || [],
      variants: updatedData.variants || products[idx].variants || [],
      discountType: updatedData.discountType || products[idx].discountType || "none",
      discountValue: parseFloat(updatedData.discountValue !== undefined ? updatedData.discountValue : products[idx].discountValue || 0)
    };
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    return products[idx];
  },

  delete: async (id) => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("products")
          .delete()
          .eq("id", id);
        if (error) {
          console.error("Supabase delete error:", error);
          throw error;
        }
        return true;
      } catch (err) {
        console.error("Supabase delete connection issue:", err);
      }
    }
    const products = initProducts();
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));
    return true;
  }
};
