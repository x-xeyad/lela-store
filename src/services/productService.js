import { supabase } from "./supabaseClient";

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
  return {
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
};

export const productService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });
      
    if (error) {
      console.error("Supabase getAll error:", error);
      throw error;
    }
    return (data || []).map(mapProductFromDb);
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();
      
    if (error) {
      console.error("Supabase getById error:", error);
      throw error;
    }
    return mapProductFromDb(data);
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
  },

  update: async (id, updatedData) => {
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
  },

  delete: async (id) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);
      
    if (error) {
      console.error("Supabase delete error:", error);
      throw error;
    }
    return true;
  }
};
