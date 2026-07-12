import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { productService } from "../services/productService";
import { settingsService } from "../services/settingsService";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../services/supabaseClient";
import { ProductCard } from "../components/ProductCard";
import { SkeletonCard } from "../components/SkeletonCard";
import { QuickViewModal } from "../components/QuickViewModal";
import { Search, SlidersHorizontal, ArrowUpDown, X, Loader2, Tag } from "lucide-react";

export const Shop = () => {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTag, setSelectedTag] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Quick View States
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const [categories, setCategories] = useState([{ id: "all", name: { en: "All", ar: "الكل" } }]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll();
      setProducts(data);

      const settings = await settingsService.get();
      const dbCategories = settings.categories || [];
      const activeCategories = [
        { id: "all", name: { en: "All", ar: "الكل" } },
        ...dbCategories.filter(c => !c.hidden).sort((a,b) => (a.order || 0) - (b.order || 0))
      ];
      setCategories(activeCategories);
      
      // Check query params
      const catParam = searchParams.get("category");
      if (catParam && activeCategories.some(c => c.name.en === catParam)) {
        setSelectedCategory(catParam);
      } else {
        setSelectedCategory("All");
      }
    } catch (e) {
      console.error("Failed to load products in Shop", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchParams]);

  useEffect(() => {
    const productsSubscription = supabase
      .channel("realtime-shop-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          loadProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsSubscription);
    };
  }, []);

  // Sync category state back to query params
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    if (category === "All") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", category);
    }
    setSearchParams(searchParams);
  };

  const allTags = ["All", ...new Set(products.flatMap(p => p.tags || []).filter(Boolean))];

  // Run Filtering & Sorting
  useEffect(() => {
    let result = [...products];

    // Search term filtering
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter((p) => {
        const nameEn = p.name.en.toLowerCase();
        const nameAr = p.name.ar.toLowerCase();
        const descEn = p.description.en.toLowerCase();
        const descAr = p.description.ar.toLowerCase();
        return (
          nameEn.includes(term) ||
          nameAr.includes(term) ||
          descEn.includes(term) ||
          descAr.includes(term)
        );
      });
    }

    // Category filtering
    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Tag filtering
    if (selectedTag !== "All") {
      result = result.filter((p) => p.tags && p.tags.includes(selectedTag));
    }

    // Sorting
    if (sortBy === "priceLowHigh") {
      result.sort((a, b) => a.priceEGP - b.priceEGP);
    } else if (sortBy === "priceHighLow") {
      result.sort((a, b) => b.priceEGP - a.priceEGP);
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    setFilteredProducts(result);
  }, [products, searchTerm, selectedCategory, selectedTag, sortBy]);

  const clearAllFilters = () => {
    setSearchTerm("");
    handleCategorySelect("All");
    setSelectedTag("All");
    setSortBy("default");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 flex-1 flex flex-col">
      {/* Page Title */}
      <div className="mb-10 text-center md:text-start">
        <h1 className="text-3xl font-light text-brand-text dark:text-brand-dark-text tracking-wide mb-2">
          {t("shop")}
        </h1>
        <p className="text-xs text-brand-text/50 dark:text-brand-dark-text/50 font-light">
          {language === "ar"
            ? "تصفحي مجموعتنا المختارة بعناية من مصر للتوصيل إلى اليمن"
            : "Explore our handpicked curation from Egypt, delivered directly to Yemen"}
        </p>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 bg-white dark:bg-brand-dark-card border border-primary/5 dark:border-secondary/5 p-4 rounded-2xl shadow-sm transition-colors duration-500 w-full">
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg/50 dark:bg-brand-dark-bg/50 text-xs text-brand-text dark:text-brand-dark-text focus:outline-none focus:border-primary transition-all duration-300"
          />
          <Search className="w-4 h-4 text-brand-text/40 dark:text-brand-dark-text/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text/40 hover:text-brand-text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="md:hidden flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-primary/10 text-xs font-semibold uppercase tracking-wider text-brand-text/70 hover:bg-primary/5 transition-all w-full justify-center"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t("filters")}
          </button>

          {/* Sort Dropdown */}
          <div className="relative w-full md:w-48 flex items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2.5 pr-8 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg/50 dark:bg-brand-dark-bg/50 text-xs text-brand-text dark:text-brand-dark-text focus:outline-none focus:border-primary transition-colors appearance-none font-medium"
            >
              <option value="default">{t("sortBy")}</option>
              <option value="priceLowHigh">{t("priceLowHigh")}</option>
              <option value="priceHighLow">{t("priceHighLow")}</option>
              <option value="rating">{t("ratingHighLow")}</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-brand-text/40 dark:text-brand-dark-text/40 absolute right-3 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1">
        {/* Left Sidebar Filter (Desktop) */}
        <aside className="hidden md:block lg:col-span-3 bg-white dark:bg-brand-dark-card border border-primary/5 dark:border-secondary/5 rounded-2xl p-6 shadow-sm space-y-6 transition-colors duration-500">
          <div className="flex justify-between items-center pb-3 border-b border-primary/5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-primary dark:text-secondary">
              {t("filters")}
            </h3>
            {(searchTerm || selectedCategory !== "All" || sortBy !== "default") && (
              <button
                onClick={clearAllFilters}
                className="text-[10px] text-red-500 hover:underline font-semibold"
              >
                {language === "ar" ? "مسح الكل" : "Clear All"}
              </button>
            )}
          </div>

          {/* Categories Filter List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-brand-text/80 dark:text-brand-dark-text/80 mb-3">
              {language === "ar" ? "التصنيفات" : "Categories"}
            </h4>
            <div className="flex flex-col gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.name.en)}
                  className={`text-xs text-left px-3 py-2 rounded-lg transition-all duration-300 font-medium ${
                    selectedCategory === cat.name.en
                      ? "bg-primary/5 text-primary dark:bg-secondary/5 dark:text-secondary font-bold"
                      : "text-brand-text/60 dark:text-brand-dark-text/60 hover:bg-brand-bg/50 dark:hover:bg-brand-dark-bg/50 hover:text-brand-text"
                  }`}
                >
                  {language === "ar" ? cat.name.ar : cat.name.en}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter List */}
          {allTags.length > 1 && (
            <div className="space-y-2 pt-4 border-t border-primary/5">
              <h4 className="text-xs font-semibold text-brand-text/80 dark:text-brand-dark-text/80 mb-3 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <span>{language === "ar" ? "الوسوم" : "Tags"}</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-all duration-300 font-semibold cursor-pointer ${
                      selectedTag === tag
                        ? "bg-primary border-primary text-white"
                        : "border-primary/10 text-brand-text/60 hover:border-primary/30"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Filters Drawer Modal */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 md:hidden bg-black/40 backdrop-blur-sm flex justify-end">
            <div className="w-80 bg-brand-bg dark:bg-brand-dark-bg h-full p-6 flex flex-col justify-between border-l border-primary/10 shadow-2xl">
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-3 border-b border-primary/5">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-primary dark:text-secondary">
                    {t("filters")}
                  </h3>
                  <button onClick={() => setShowMobileFilters(false)}>
                    <X className="w-5 h-5 text-brand-text/60" />
                  </button>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-brand-text/80 dark:text-brand-dark-text/80">
                    {language === "ar" ? "التصنيفات" : "Categories"}
                  </h4>
                  <div className="flex flex-col gap-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          handleCategorySelect(cat.name.en);
                          setShowMobileFilters(false);
                        }}
                        className={`text-xs text-left px-3 py-2 rounded-lg transition-all duration-300 font-medium ${
                          selectedCategory === cat.name.en
                            ? "bg-primary/5 text-primary dark:bg-secondary/5 dark:text-secondary font-bold"
                            : "text-brand-text/60 dark:text-brand-dark-text/60 hover:bg-brand-bg/50 dark:hover:bg-brand-dark-bg/50"
                        }`}
                      >
                        {language === "ar" ? cat.name.ar : cat.name.en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Tags Filter */}
                {allTags.length > 1 && (
                  <div className="space-y-3 pt-4 border-t border-primary/5">
                    <h4 className="text-xs font-semibold text-brand-text/80 dark:text-brand-dark-text/80 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-primary" />
                      <span>{language === "ar" ? "الوسوم" : "Tags"}</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {allTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            setSelectedTag(tag);
                            setShowMobileFilters(false);
                          }}
                          className={`text-[10px] px-2.5 py-1 rounded-full border transition-all duration-300 font-semibold cursor-pointer ${
                            selectedTag === tag
                              ? "bg-primary border-primary text-white"
                              : "border-primary/10 text-brand-text/60"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {(searchTerm || selectedCategory !== "All" || sortBy !== "default") && (
                <button
                  onClick={() => {
                    clearAllFilters();
                    setShowMobileFilters(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold font-english uppercase tracking-wider transition-all duration-300"
                >
                  {language === "ar" ? "مسح التصفية" : "Clear All Filters"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Right Product Grid */}
        <main className="lg:col-span-9 flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-84 text-center">
              <div className="text-brand-text/30 dark:text-brand-dark-text/30 text-xs font-light max-w-xs leading-relaxed">
                {t("noProducts")}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => {
                    setSelectedQuickViewProduct(p);
                    setIsQuickViewOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={selectedQuickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => {
          setIsQuickViewOpen(false);
          setSelectedQuickViewProduct(null);
        }}
      />
    </div>
  );
};
