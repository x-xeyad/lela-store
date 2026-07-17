import React, { useState, useEffect, useMemo } from "react";
import { useAdmin } from "../context/AdminContext";
import { productService } from "../services/productService";
import { settingsService } from "../services/settingsService";
import { orderService } from "../services/orderService";
import { storageService } from "../services/storageService";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../services/supabaseClient";
import toast from "react-hot-toast";
import {
  Lock,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  Scale,
  Palette,
  HelpCircle,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Save,
  CheckCircle,
  X,
  Upload,
  ArrowRightLeft,
  Layers,
  Download,
  Eye,
  EyeOff,
  Coins,
  Sparkles,
  Archive,
  TrendingDown,
  UserCheck,
  FileText,
  Search,
  Bell,
  UserPlus,
  FileSpreadsheet,
  AlertTriangle
} from "lucide-react";

// ERP Services & Components
import { erpService } from "../services/erpService";
import { ErpDashboard } from "../components/erp/ErpDashboard";
import { ErpPurchases } from "../components/erp/ErpPurchases";
import { ErpInventory } from "../components/erp/ErpInventory";
import { ErpShipping } from "../components/erp/ErpShipping";
import { ErpExpenses } from "../components/erp/ErpExpenses";
import { ErpSuppliers } from "../components/erp/ErpSuppliers";
import { ErpReports } from "../components/erp/ErpReports";
import { excelExportService } from "../services/excelExportService";
import { ErpTreasury } from "../components/erp/ErpTreasury";
import { ErpRepresentatives } from "../components/erp/ErpRepresentatives";
import { ErpWholesalers } from "../components/erp/ErpWholesalers";
const parseVariants = (text) => {
  if (!text) return [];
  return text.split("|").map(part => {
    const [name, opts] = part.split(":");
    if (!name || !opts) return null;
    return {
      name: name.trim(),
      options: opts.split(",").map(o => o.trim()).filter(Boolean)
    };
  }).filter(Boolean);
};

const serializeVariants = (variants) => {
  if (!variants || variants.length === 0) return "";
  return variants.map(v => `${v.name}: ${v.options.join(", ")}`).join(" | ");
};

export const Admin = () => {
  const { isAuthenticated, user, login, logout } = useAdmin();
  const { language, t } = useLanguage();
  const { loadThemeSettings, isDark } = useTheme();
  
  // Login State
  const [passwordInput, setPasswordInput] = useState("");
  const [emailInput, setEmailInput] = useState("admin@lela.com");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState("dashboard");

  // Core Data Lists
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);

  // ERP Accounting & Inventory Lists
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [shippingCompanies, setShippingCompanies] = useState([]);
  const [movements, setMovements] = useState([]);
  const [wholesaleInvoices, setWholesaleInvoices] = useState([]);
  const [treasuryTransactions, setTreasuryTransactions] = useState([]);
  const [userRole, setUserRole] = useState("owner");
  const [profiles, setProfiles] = useState([]);
  const [representatives, setRepresentatives] = useState([]);
  const [wholesalers, setWholesalers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  // Forms States - Products
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    nameEn: "",
    nameAr: "",
    descEn: "",
    descAr: "",
    category: "Clothing",
    priceEGP: "",
    weight: "",
    imagesText: "",
    featured: false,
    sizesText: "",
    colorsText: "",
    costEGP: "",
    profitEGP: "",
    stock: "10",
    status: "visible",
    tagsText: "new",
    discountType: "none",
    discountValue: "0",
    variantsText: "",
    purchaseCost: "",
    packagingCost: ""
  });

  // Forms States - Shipping & Settings
  const [shippingForm, setShippingForm] = useState({
    personalCare: 450,
    clothingHome: 300,
    egpToYerRate: 11.5,
    yerToSarRate: 140
  });

  const [brandingForm, setBrandingForm] = useState({
    heroTitleEn: "",
    heroTitleAr: "",
    heroSubtitleEn: "",
    heroSubtitleAr: "",
    logoUrl: "",
    logoDarkUrl: "",
    faviconUrl: "",
    loadingLogoUrl: "",
    browserIconUrl: "",
    websiteName: "LELA",
    primaryColor: "#8A3D5A",
    secondaryColor: "#E3B8AE",
    accentColor: "#D7A5AE",
    backgroundColor: "#FFF9F7",
    textColor: "#3A2A30",
    darkPrimaryColor: "#8A3D5A",
    darkSecondaryColor: "#E3B8AE",
    darkAccentColor: "#D7A5AE",
    darkBackgroundColor: "#0F172A",
    darkTextColor: "#FFFFFF",
    buttonRadius: "12px",
    borderWidth: "1px",
    cardBg: "#FFFFFF",
    darkCardBg: "#1E293B",
    phoneEgypt: "",
    phoneYemen: "",
    email: "",
    instagram: "",
    facebook: ""
  });

  // Forms States - FAQ & Reviews
  const [editingFaq, setEditingFaq] = useState(null);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [faqForm, setFaqForm] = useState({ qEn: "", qAr: "", aEn: "", aAr: "" });

  const [editingReview, setEditingReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: "", rating: 5, date: "", commentEn: "", commentAr: "", avatar: "" });

  // Categories States
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Concierge Special Orders, Coupons, Logs, SEO & Maintenance states
  const [specialOrders, setSpecialOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [seoForm, setSeoForm] = useState({ title: "", description: "", keywords: "" });

  // Announcements, Why LELA, and How It Works states
  const [announcementConfig, setAnnouncementConfig] = useState({
    enabled: false,
    backgroundColor: "#8A3D5A",
    textColor: "#FFFFFF",
    scrolling: true,
    items: []
  });
  const [whyLelaList, setWhyLelaList] = useState([]);
  const [howItWorksList, setHowItWorksList] = useState([]);

  const [editingAnnItem, setEditingAnnItem] = useState(null);
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annItemForm, setAnnItemForm] = useState({ textEn: "", textAr: "", startDate: "", endDate: "" });

  const [editingWhyCard, setEditingWhyCard] = useState(null);
  const [showWhyCardModal, setShowWhyCardModal] = useState(false);
  const [whyCardForm, setWhyCardForm] = useState({ id: "", icon: "Sparkles", titleEn: "", titleAr: "", descEn: "", descAr: "", order: 1 });

  const [editingHowStep, setEditingHowStep] = useState(null);
  const [showHowStepModal, setShowHowStepModal] = useState(false);
  const [howStepForm, setHowStepForm] = useState({ step: 1, titleEn: "", titleAr: "", descEn: "", descAr: "" });

  const [editingCoupon, setEditingCoupon] = useState(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "10",
    expirationDate: "",
    maxUses: "",
    minOrderValue: "",
    active: true
  });
  const [categoryForm, setCategoryForm] = useState({
    nameEn: "",
    nameAr: "",
    image: "",
    hidden: false,
    order: 1
  });

  // Load all admin data
  const loadData = async () => {
    try {
      const [
        allProducts, 
        allOrders, 
        allSettings, 
        categoriesList, 
        faqsList, 
        reviewsList,
        purchasesList,
        suppliersList,
        expensesList,
        shippingCompaniesList,
        movementsList,
        wholesaleInvsList,
        treasuryTransList,
        repsList,
        wholesalersList,
        profilesList
      ] = await Promise.all([
        productService.getAll(),
        orderService.getAll(),
        settingsService.get(),
        settingsService.getCategories(),
        settingsService.getFaqs(),
        settingsService.getReviews(),
        erpService.getPurchases(),
        erpService.getSuppliers(),
        erpService.getExpenses(),
        erpService.getShippingCompanies(),
        erpService.getStockMovements(),
        erpService.getWholesaleInvoices(),
        erpService.getTreasuryTransactions(),
        erpService.getRepresentatives(),
        erpService.getWholesalers(),
        erpService.getProfiles()
      ]);

      setProducts(allProducts);
      setOrders(allOrders);
      if (allSettings) {
        allSettings.faq = faqsList || [];
        allSettings.reviews = reviewsList || [];
      }
      setSettings(allSettings);
      setPurchases(purchasesList || []);
      setSuppliers(suppliersList || []);
      setExpenses(expensesList || []);
      setShippingCompanies(shippingCompaniesList || []);
      setMovements(movementsList || []);
      setWholesaleInvoices(wholesaleInvsList || []);
      setTreasuryTransactions(treasuryTransList || []);
      setRepresentatives(repsList || []);
      setWholesalers(wholesalersList || []);
      setProfiles(profilesList || []);

      // Fetch user profile role
      if (user) {
        try {
          const { data: profs, error: profErr } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id);
          if (!profErr && profs && profs.length > 0) {
            setUserRole(profs[0].role);
          }
        } catch (e) {
          console.warn("Failed to fetch user role:", e);
        }
      }

      // Prepopulate Forms
      setShippingForm({
        personalCare: allSettings?.shippingRates?.personalCare || 450,
        clothingHome: allSettings?.shippingRates?.clothingHome || 300,
        egpToYerRate: allSettings?.currency?.egpToYerRate || 11.5,
        yerToSarRate: allSettings?.currency?.yerToSarRate || 140
      });

      setCategories(categoriesList || []);

      // Load Special Sourcing orders, Coupons, Activity logs, SEO & Maintenance
      const specialList = await settingsService.getSpecialOrders();
      setSpecialOrders(specialList || []);

      const couponsList = await settingsService.getCoupons();
      setCoupons(couponsList || []);

      const logsList = await settingsService.getActivityLogs();
      setActivityLogs(logsList || []);

      const seoSettings = await settingsService.getSeoSettings();
      setSeoForm({
        title: seoSettings?.title || "",
        description: seoSettings?.description || "",
        keywords: seoSettings?.keywords || ""
      });

      const mode = await settingsService.getMaintenanceMode();
      setMaintenanceMode(mode || false);

      setBrandingForm({
        heroTitleEn: allSettings?.homepage?.hero?.title?.en || "",
        heroTitleAr: allSettings?.homepage?.hero?.title?.ar || "",
        heroSubtitleEn: allSettings?.homepage?.hero?.subtitle?.en || "",
        heroSubtitleAr: allSettings?.homepage?.hero?.subtitle?.ar || "",
        logoUrl: allSettings?.branding?.logoUrl || "",
        logoDarkUrl: allSettings?.branding?.logoDarkUrl || "",
        faviconUrl: allSettings?.branding?.faviconUrl || "",
        loadingLogoUrl: allSettings?.branding?.loadingLogoUrl || "",
        browserIconUrl: allSettings?.branding?.browserIconUrl || "",
        websiteName: allSettings?.branding?.websiteName || "LELA",
        
        primaryColor: allSettings?.theme?.primaryColor || allSettings?.branding?.primaryColor || "#8A3D5A",
        secondaryColor: allSettings?.theme?.secondaryColor || allSettings?.branding?.secondaryColor || "#E3B8AE",
        accentColor: allSettings?.theme?.accentColor || "#D7A5AE",
        backgroundColor: allSettings?.theme?.backgroundColor || allSettings?.branding?.backgroundColor || "#FFF9F7",
        textColor: allSettings?.theme?.textColor || allSettings?.branding?.textColor || "#3A2A30",
        
        darkPrimaryColor: allSettings?.theme?.darkPrimaryColor || "#8A3D5A",
        darkSecondaryColor: allSettings?.theme?.darkSecondaryColor || "#E3B8AE",
        darkAccentColor: allSettings?.theme?.darkAccentColor || "#D7A5AE",
        darkBackgroundColor: allSettings?.theme?.darkBackgroundColor || "#0F172A",
        darkTextColor: allSettings?.theme?.darkTextColor || "#FFFFFF",
        
        buttonRadius: allSettings?.theme?.buttonRadius || "12px",
        borderWidth: allSettings?.theme?.borderWidth || "1px",
        cardBg: allSettings?.theme?.cardBg || "#FFFFFF",
        darkCardBg: allSettings?.theme?.darkCardBg || "#1E293B",

        phoneEgypt: allSettings?.contactInfo?.phoneEgypt || "",
        phoneYemen: allSettings?.contactInfo?.phoneYemen || "",
        email: allSettings?.contactInfo?.email || "",
        instagram: allSettings?.contactInfo?.instagram || "",
        facebook: allSettings?.contactInfo?.facebook || ""
      });

      // Load homepage content sections
      setWhyLelaList(allSettings?.homepage?.whyLela || []);
      setHowItWorksList(allSettings?.homepage?.howItWorks || []);

      // Load announcement settings
      const annConfig = await settingsService.getAnnouncements();
      setAnnouncementConfig(annConfig || {
        enabled: false,
        backgroundColor: "#8A3D5A",
        textColor: "#FFFFFF",
        scrolling: true,
        items: []
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to load admin settings.");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();

      const adminSubscription = supabase
        .channel("realtime-admin")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          () => { loadData(); }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products" },
          () => { loadData(); }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(adminSubscription);
      };
    }
  }, [isAuthenticated]);

  // Live color theme preview in admin dashboard
  useEffect(() => {
    if (!isAuthenticated) return;
    const root = document.documentElement;
    if (isDark) {
      // Apply Dark mode previews instantly
      if (brandingForm.darkPrimaryColor) root.style.setProperty("--primary", brandingForm.darkPrimaryColor);
      if (brandingForm.darkPrimaryColor) root.style.setProperty("--primary-dark", brandingForm.darkPrimaryColor);
      if (brandingForm.darkAccentColor) root.style.setProperty("--primary-light", brandingForm.darkAccentColor);
      if (brandingForm.darkSecondaryColor) root.style.setProperty("--secondary", brandingForm.darkSecondaryColor);
      if (brandingForm.darkBackgroundColor) root.style.setProperty("--background", brandingForm.darkBackgroundColor);
      if (brandingForm.darkCardBg) root.style.setProperty("--surface", brandingForm.darkCardBg);
      if (brandingForm.darkTextColor) root.style.setProperty("--text", brandingForm.darkTextColor);
    } else {
      // Apply Light mode previews instantly
      if (brandingForm.primaryColor) root.style.setProperty("--primary", brandingForm.primaryColor);
      if (brandingForm.primaryColor) root.style.setProperty("--primary-dark", brandingForm.primaryColor);
      if (brandingForm.accentColor) root.style.setProperty("--primary-light", brandingForm.accentColor);
      if (brandingForm.secondaryColor) root.style.setProperty("--secondary", brandingForm.secondaryColor);
      if (brandingForm.backgroundColor) root.style.setProperty("--background", brandingForm.backgroundColor);
      if (brandingForm.cardBg) root.style.setProperty("--surface", brandingForm.cardBg);
      if (brandingForm.textColor) root.style.setProperty("--text", brandingForm.textColor);
    }
  }, [
    isAuthenticated,
    isDark,
    brandingForm.primaryColor,
    brandingForm.secondaryColor,
    brandingForm.accentColor,
    brandingForm.backgroundColor,
    brandingForm.cardBg,
    brandingForm.textColor,
    brandingForm.darkPrimaryColor,
    brandingForm.darkSecondaryColor,
    brandingForm.darkAccentColor,
    brandingForm.darkBackgroundColor,
    brandingForm.darkCardBg,
    brandingForm.darkTextColor
  ]);

  // LOGIN TRIGGER
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      await login(emailInput, passwordInput, rememberMe);
      toast.success("Successfully logged in as Admin!");
    } catch (err) {
      toast.error(err.message || "Incorrect passcode. Try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  // PRODUCT OPERATIONS
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      nameEn: "",
      nameAr: "",
      descEn: "",
      descAr: "",
      category: "Clothing",
      priceEGP: "",
      weight: "0.5",
      imagesText: "",
      featured: false,
      sizesText: "",
      colorsText: "",
      costEGP: "",
      profitEGP: "",
      stock: "10",
      status: "visible",
      tagsText: "new",
      discountType: "none",
      discountValue: "0",
      variantsText: "",
      purchaseCost: "",
      packagingCost: ""
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      nameEn: prod.name.en,
      nameAr: prod.name.ar,
      descEn: prod.description.en,
      descAr: prod.description.ar,
      category: prod.category,
      priceEGP: prod.priceEGP.toString(),
      weight: prod.weight.toString(),
      imagesText: prod.images.join("\n"),
      featured: prod.featured || false,
      sizesText: (prod.sizes || []).join(", "),
      colorsText: (prod.colors || []).join(", "),
      costEGP: (prod.costEGP !== undefined ? prod.costEGP : Math.round(prod.priceEGP * 0.8)).toString(),
      profitEGP: (prod.profitEGP !== undefined ? prod.profitEGP : Math.round(prod.priceEGP * 0.2)).toString(),
      stock: (prod.stock !== undefined ? prod.stock : 10).toString(),
      status: prod.status || "visible",
      tagsText: (prod.tags || []).join(", "),
      discountType: prod.discountType || "none",
      discountValue: (prod.discountValue !== undefined ? prod.discountValue : 0).toString(),
      variantsText: serializeVariants(prod.variants),
      purchaseCost: (prod.purchaseCost !== undefined ? prod.purchaseCost : Math.round(prod.costEGP * 0.8)).toString(),
      packagingCost: (prod.packagingCost !== undefined ? prod.packagingCost : 0).toString()
    });
    setShowProductModal(true);
  };

  const getImagesList = () => {
    return productForm.imagesText ? productForm.imagesText.split("\n").filter(Boolean) : [];
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    toast.loading("Uploading images...", { id: "upload" });
    try {
      const uploadPromises = files.map(file => storageService.upload(file, "products"));
      const urls = await Promise.all(uploadPromises);
      
      setProductForm(prev => {
        const existing = prev.imagesText ? prev.imagesText.split("\n").filter(Boolean) : [];
        const updated = [...existing, ...urls].join("\n");
        return { ...prev, imagesText: updated };
      });
      toast.success("Images uploaded successfully!", { id: "upload" });
    } catch (err) {
      console.error(err);
      toast.error("Upload failed", { id: "upload" });
    }
  };

  const handleReorderImage = (idx, direction) => {
    const list = getImagesList();
    if (direction === "up" && idx > 0) {
      const temp = list[idx];
      list[idx] = list[idx - 1];
      list[idx - 1] = temp;
    } else if (direction === "down" && idx < list.length - 1) {
      const temp = list[idx];
      list[idx] = list[idx + 1];
      list[idx + 1] = temp;
    }
    setProductForm(prev => ({ ...prev, imagesText: list.join("\n") }));
  };

  const handleDeleteImage = (idx) => {
    const list = getImagesList();
    list.splice(idx, 1);
    setProductForm(prev => ({ ...prev, imagesText: list.join("\n") }));
  };

  const handleSetCoverImage = (idx) => {
    const list = getImagesList();
    const cover = list.splice(idx, 1)[0];
    list.unshift(cover);
    setProductForm(prev => ({ ...prev, imagesText: list.join("\n") }));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const imageList = productForm.imagesText.split("\n").map(l => l.trim()).filter(Boolean);
    const sizeList = productForm.sizesText.split(",").map(s => s.trim()).filter(Boolean);
    const colorList = productForm.colorsText.split(",").map(c => c.trim()).filter(Boolean);
    const tagList = productForm.tagsText.split(",").map(t => t.trim()).filter(Boolean);

    const purchaseCostVal = parseFloat(productForm.purchaseCost || 0);
    const packagingCostVal = parseFloat(productForm.packagingCost || 0);
    const weightVal = parseFloat(productForm.weight || 0.5);
    const profitVal = parseFloat(productForm.profitEGP || 0);
    
    // Automatically calculate shipping cost per KG based on category
    const ratePerKg = productForm.category === "Personal Care"
      ? (settings?.shippingRates?.personalCare || 450)
      : (settings?.shippingRates?.clothingHome || 300);
    const shippingCostVal = ratePerKg * weightVal;
    
    const costEGPVal = purchaseCostVal + shippingCostVal + packagingCostVal;
    const priceEGPVal = costEGPVal + profitVal;

    const productPayload = {
      name: { en: productForm.nameEn, ar: productForm.nameAr },
      description: { en: productForm.descEn, ar: productForm.descAr },
      category: productForm.category,
      costEGP: costEGPVal,
      profitEGP: profitVal,
      priceEGP: priceEGPVal,
      weight: weightVal,
      images: imageList.length > 0 ? imageList : ["https://images.unsplash.com/photo-1584917865442-de89df76afd3"],
      featured: productForm.featured,
      sizes: sizeList,
      colors: colorList,
      stock: parseInt(productForm.stock || 10, 10),
      status: productForm.status || "visible",
      tags: tagList,
      discountType: productForm.discountType || "none",
      discountValue: parseFloat(productForm.discountValue || 0),
      variants: parseVariants(productForm.variantsText),
      purchaseCost: purchaseCostVal,
      packagingCost: packagingCostVal,
      shippingCost: shippingCostVal
    };

    try {
      if (editingProduct) {
        await productService.update(editingProduct.id, productPayload);
        await settingsService.addActivityLog(`Concierge updated product: ${productForm.nameEn}`);
        toast.success("Product updated successfully.");
      } else {
        await productService.create(productPayload);
        await settingsService.addActivityLog(`Concierge created product: ${productForm.nameEn}`);
        toast.success("Product created successfully.");
      }
      setShowProductModal(false);
      loadData();
    } catch (e) {
      console.error(e);
      toast.error("Operation failed.");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      const prod = products.find(p => p.id === id);
      await productService.delete(id);
      await settingsService.addActivityLog(`Concierge deleted product ID: ${id} (${prod?.name?.en || 'Unnamed'})`);
      toast.success("Product deleted.");
      loadData();
    }
  };

  // ORDER OPERATIONS
  const handleUpdateOrderStatus = async (id, status) => {
    await orderService.updateStatus(id, status);
    toast.success("Order status updated.");
    loadData();
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm("Delete order record?")) {
      await orderService.delete(id);
      toast.success("Order record deleted.");
      loadData();
    }
  };

  // SHIPPING & RATES OPERATIONS
  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    try {
      await settingsService.updateShippingRates({
        personalCare: parseFloat(shippingForm.personalCare),
        clothingHome: parseFloat(shippingForm.clothingHome)
      });
      await settingsService.updateCurrency({
        egpToYerRate: parseFloat(shippingForm.egpToYerRate),
        yerToSarRate: parseFloat(shippingForm.yerToSarRate || 140)
      });
      await settingsService.addActivityLog("Shipping rates and Exchange parameters updated");
      toast.success("Shipping rates and Exchange rate updated.");
      loadData();
    } catch (e) {
      toast.error("Update failed.");
    }
  };

  // SPECIAL ORDERS SOURCING OPERATIONS
  const handleUpdateSpecialOrderStatus = async (id, status) => {
    try {
      await settingsService.updateSpecialOrderStatus(id, status);
      await settingsService.addActivityLog(`Special Order ID ${id} status updated to ${status}`);
      toast.success("Special order status updated.");
      loadData();
    } catch (e) {
      console.error(e);
      toast.error("Failed to update status.");
    }
  };

  const handleDeleteSpecialOrder = async (id) => {
    if (window.confirm("Delete special request?")) {
      try {
        await settingsService.deleteSpecialOrder(id);
        await settingsService.addActivityLog(`Special Order ID ${id} deleted`);
        toast.success("Special request deleted.");
        loadData();
      } catch (e) {
        console.error(e);
        toast.error("Failed to delete special request.");
      }
    }
  };

  // COUPON OPERATIONS
  const handleOpenAddCoupon = () => {
    setEditingCoupon(null);
    setCouponForm({
      code: "",
      discountType: "percentage",
      discountValue: "10",
      expirationDate: "",
      maxUses: "",
      minOrderValue: "",
      active: true
    });
    setShowCouponModal(true);
  };

  const handleOpenEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      discountType: coupon.discountType || "percentage",
      discountValue: (coupon.discountValue !== undefined ? coupon.discountValue : coupon.discount).toString(),
      expirationDate: coupon.expirationDate || "",
      maxUses: coupon.maxUses ? coupon.maxUses.toString() : "",
      minOrderValue: coupon.minOrderValue ? coupon.minOrderValue.toString() : "",
      active: coupon.active
    });
    setShowCouponModal(true);
  };

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    try {
      const list = await settingsService.getCoupons();
      const payload = {
        code: couponForm.code.toUpperCase().trim(),
        discountType: couponForm.discountType,
        discountValue: parseFloat(couponForm.discountValue || 0),
        discount: parseFloat(couponForm.discountValue || 0),
        expirationDate: couponForm.expirationDate || null,
        maxUses: couponForm.maxUses ? parseInt(couponForm.maxUses, 10) : null,
        minOrderValue: couponForm.minOrderValue ? parseFloat(couponForm.minOrderValue) : null,
        active: couponForm.active
      };

      if (editingCoupon) {
        const idx = list.findIndex(c => c.code === editingCoupon.code);
        if (idx !== -1) {
          list[idx] = payload;
          await settingsService.addActivityLog(`Coupon ${payload.code} updated`);
        }
      } else {
        if (list.some(c => c.code === payload.code)) {
          toast.error("Coupon code already exists.");
          return;
        }
        list.push(payload);
        await settingsService.addActivityLog(`Coupon ${payload.code} created`);
      }

      await settingsService.saveCoupons(list);
      toast.success("Coupon saved successfully.");
      setShowCouponModal(false);
      loadData();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save coupon.");
    }
  };

  const handleDeleteCoupon = async (code) => {
    if (window.confirm(`Delete coupon code ${code}?`)) {
      try {
        const list = await settingsService.getCoupons();
        const filtered = list.filter(c => c.code !== code);
        await settingsService.saveCoupons(filtered);
        await settingsService.addActivityLog(`Coupon ${code} deleted`);
        toast.success("Coupon deleted.");
        loadData();
      } catch (e) {
        toast.error("Failed to delete coupon.");
      }
    }
  };

  // SEO & MAINTENANCE OPERATIONS
  const handleSeoSubmit = async (e) => {
    e.preventDefault();
    try {
      await settingsService.saveSeoSettings({
        title: seoForm.title.trim(),
        description: seoForm.description.trim(),
        keywords: seoForm.keywords.trim()
      });
      await settingsService.addActivityLog("SEO Metadata Settings updated");
      toast.success("SEO Settings updated successfully.");
      loadData();
    } catch (e) {
      toast.error("Failed to update SEO settings.");
    }
  };

  const handleToggleMaintenanceMode = async (checked) => {
    try {
      await settingsService.saveMaintenanceMode(checked);
      setMaintenanceMode(checked);
      await settingsService.addActivityLog(`Maintenance mode toggled to: ${checked ? "ON" : "OFF"}`);
      toast.success(checked ? "Maintenance mode activated." : "Maintenance mode deactivated.");
      loadData();
    } catch (e) {
      toast.error("Failed to update maintenance mode.");
    }
  };

  // BACKUP IMPORT RESTORATION
  const handleImportBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.products && data.settings) {
          // Import products into Supabase
          if (data.products.length > 0) {
            await supabase.from("products").delete().neq("id", "0");
            const mappedProds = data.products.map(p => ({
              id: p.id,
              name: p.name,
              description: p.description,
              category: p.category,
              cost_egp: p.costEGP || 0,
              profit_egp: p.profitEGP || 0,
              price_egp: p.priceEGP || 0,
              weight: p.weight || 0.5,
              images: p.images || [],
              featured: !!p.featured,
              sizes: p.sizes || [],
              colors: p.colors || [],
              variants: p.variants || [],
              stock: p.stock || 10,
              status: p.status || "visible",
              tags: p.tags || [],
              rating: p.rating || 5.0,
              reviews_count: p.reviewsCount || 0,
              discount_type: p.discountType || "none",
              discount_value: p.discountValue || 0
            }));
            await supabase.from("products").insert(mappedProds);
          }
          // Import settings key values into Supabase
          for (const [key, value] of Object.entries(data.settings)) {
            await supabase.from("settings").upsert({ key, value });
          }
          await settingsService.addActivityLog("concierge database fully restored from backup");
          toast.success("Concierge database restored successfully!");
          loadData();
          await loadThemeSettings();
        } else {
          toast.error("Invalid backup file format.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to restore backup.");
      }
    };
    reader.readAsText(file);
  };


  // HOMEPAGE SECTIONS & ANNOUNCEMENT BAR HANDLERS
  const handleSaveAnnConfig = async () => {
    try {
      await settingsService.saveAnnouncements(announcementConfig);
      toast.success("Announcement configuration saved successfully!");
      loadData();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save announcements");
    }
  };

  const handleSaveWhyLelaCard = async (cardData) => {
    const updated = [...whyLelaList];
    const idx = updated.findIndex(c => c.id === cardData.id);
    if (idx >= 0) {
      updated[idx] = cardData;
    } else {
      updated.push({ ...cardData, id: String(Date.now()) });
    }
    updated.sort((a, b) => parseInt(a.order || 99) - parseInt(b.order || 99));
    setWhyLelaList(updated);
    
    try {
      await settingsService.updateHomepage({ whyLela: updated });
      toast.success("Why LELA cards updated!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save Why LELA cards");
    }
  };

  const handleDeleteWhyLelaCard = async (id) => {
    const filtered = whyLelaList.filter(c => c.id !== id);
    setWhyLelaList(filtered);
    try {
      await settingsService.updateHomepage({ whyLela: filtered });
      toast.success("Card deleted successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete card");
    }
  };

  const handleSaveHowItWorksStep = async (stepData) => {
    const updated = [...howItWorksList];
    const idx = updated.findIndex(s => s.step === stepData.step);
    if (idx >= 0) {
      updated[idx] = stepData;
    } else {
      updated.push(stepData);
    }
    updated.sort((a, b) => a.step - b.step);
    setHowItWorksList(updated);
    
    try {
      await settingsService.updateHomepage({ howItWorks: updated });
      toast.success("How It Works steps updated!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save How It Works steps");
    }
  };

  const handleDeleteHowItWorksStep = async (stepNum) => {
    const filtered = howItWorksList.filter(s => s.step !== stepNum);
    const reindexed = filtered.map((s, idx) => ({ ...s, step: idx + 1 }));
    setHowItWorksList(reindexed);
    try {
      await settingsService.updateHomepage({ howItWorks: reindexed });
      toast.success("Step deleted successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete step");
    }
  };

  // BRANDING & HERO OPERATIONS
  const handleBrandingSubmit = async (e) => {
    e.preventDefault();
    try {
      await settingsService.updateHomepage({
        hero: {
          title: { en: brandingForm.heroTitleEn, ar: brandingForm.heroTitleAr },
          subtitle: { en: brandingForm.heroSubtitleEn, ar: brandingForm.heroSubtitleAr }
        }
      });
      await settingsService.updateContactInfo({
        phoneEgypt: brandingForm.phoneEgypt,
        phoneYemen: brandingForm.phoneYemen,
        email: brandingForm.email,
        instagram: brandingForm.instagram,
        facebook: brandingForm.facebook
      });
      await settingsService.updateBranding({
        logoUrl: brandingForm.logoUrl,
        logoDarkUrl: brandingForm.logoDarkUrl,
        faviconUrl: brandingForm.faviconUrl,
        loadingLogoUrl: brandingForm.loadingLogoUrl,
        browserIconUrl: brandingForm.browserIconUrl,
        websiteName: brandingForm.websiteName
      });
      await settingsService.updateTheme({
        primaryColor: brandingForm.primaryColor,
        secondaryColor: brandingForm.secondaryColor,
        accentColor: brandingForm.accentColor,
        backgroundColor: brandingForm.backgroundColor,
        textColor: brandingForm.textColor,
        darkPrimaryColor: brandingForm.darkPrimaryColor,
        darkSecondaryColor: brandingForm.darkSecondaryColor,
        darkAccentColor: brandingForm.darkAccentColor,
        darkBackgroundColor: brandingForm.darkBackgroundColor,
        darkTextColor: brandingForm.darkTextColor,
        buttonRadius: brandingForm.buttonRadius,
        borderWidth: brandingForm.borderWidth,
        cardBg: brandingForm.cardBg,
        darkCardBg: brandingForm.darkCardBg
      });
      toast.success("Branding, theme colors, and assets saved successfully!");
      loadData();
      await loadThemeSettings();
    } catch (e) {
      console.error(e);
      toast.error("Update failed.");
    }
  };

  const handleLogoUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    toast.loading("Uploading branding asset...", { id: "logo-upload" });
    try {
      const url = await storageService.upload(file, "branding");
      setBrandingForm(prev => ({ ...prev, [field]: url }));
      toast.success("Asset uploaded successfully!", { id: "logo-upload" });
    } catch (err) {
      console.error(err);
      toast.error("Upload failed", { id: "logo-upload" });
    }
  };

  // FAQ OPERATIONS
  const handleOpenAddFaq = () => {
    setEditingFaq(null);
    setFaqForm({ qEn: "", qAr: "", aEn: "", aAr: "" });
    setShowFaqModal(true);
  };

  const handleOpenEditFaq = (faq) => {
    setEditingFaq(faq);
    setFaqForm({ qEn: faq.question.en, qAr: faq.question.ar, aEn: faq.answer.en, aAr: faq.answer.ar });
    setShowFaqModal(true);
  };

  const handleFaqSubmit = async (e) => {
    e.preventDefault();
    const updatedFaqs = [...(settings?.faq || [])];
    const payload = {
      id: editingFaq ? editingFaq.id : "f_" + Date.now(),
      question: { en: faqForm.qEn, ar: faqForm.qAr },
      answer: { en: faqForm.aEn, ar: faqForm.aAr }
    };

    if (editingFaq) {
      const idx = updatedFaqs.findIndex(f => f.id === editingFaq.id);
      updatedFaqs[idx] = payload;
    } else {
      updatedFaqs.push(payload);
    }

    await settingsService.saveFaqs(updatedFaqs);
    toast.success("FAQ saved.");
    setShowFaqModal(false);
    loadData();
  };

  const handleDeleteFaq = async (id) => {
    if (window.confirm("Delete FAQ?")) {
      const filtered = (settings?.faq || []).filter(f => f.id !== id);
      await settingsService.saveFaqs(filtered);
      toast.success("FAQ deleted.");
      loadData();
    }
  };

  // REVIEWS OPERATIONS
  const handleOpenAddReview = () => {
    setEditingReview(null);
    setReviewForm({ name: "", rating: 5, date: new Date().toISOString().split("T")[0], commentEn: "", commentAr: "", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" });
    setShowReviewModal(true);
  };

  const handleOpenEditReview = (rev) => {
    setEditingReview(rev);
    setReviewForm({
      name: rev.name,
      rating: rev.rating,
      date: rev.date,
      commentEn: rev.comment.en,
      commentAr: rev.comment.ar,
      avatar: rev.avatar
    });
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const updatedReviews = [...(settings?.reviews || [])];
    const payload = {
      id: editingReview ? editingReview.id : "r_" + Date.now(),
      name: reviewForm.name,
      rating: parseInt(reviewForm.rating, 10),
      date: reviewForm.date,
      comment: { en: reviewForm.commentEn, ar: reviewForm.commentAr },
      avatar: reviewForm.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    };

    if (editingReview) {
      const idx = updatedReviews.findIndex(r => r.id === editingReview.id);
      updatedReviews[idx] = payload;
    } else {
      updatedReviews.push(payload);
    }

    await settingsService.saveReviews(updatedReviews);
    toast.success("Review saved.");
    setShowReviewModal(false);
    loadData();
  };

  const handleDeleteReview = async (id) => {
    if (window.confirm("Delete review?")) {
      const filtered = (settings?.reviews || []).filter(r => r.id !== id);
      await settingsService.saveReviews(filtered);
      toast.success("Review deleted.");
      loadData();
    }
  };

  // CATEGORIES OPERATIONS
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ nameEn: "", nameAr: "", image: "", hidden: false, order: categories.length + 1 });
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      nameEn: cat.name.en,
      nameAr: cat.name.ar,
      image: cat.image,
      hidden: cat.hidden || false,
      order: cat.order || 1
    });
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const updatedCategories = [...categories];
    const payload = {
      id: editingCategory ? editingCategory.id : "c_" + Date.now(),
      name: { en: categoryForm.nameEn, ar: categoryForm.nameAr },
      image: categoryForm.image || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400",
      hidden: categoryForm.hidden,
      order: parseInt(categoryForm.order, 10) || 1
    };

    if (editingCategory) {
      const idx = updatedCategories.findIndex(c => c.id === editingCategory.id);
      updatedCategories[idx] = payload;
    } else {
      updatedCategories.push(payload);
    }

    // Sort categories by order
    updatedCategories.sort((a, b) => a.order - b.order);

    await settingsService.saveCategories(updatedCategories);
    toast.success("Category saved.");
    setShowCategoryModal(false);
    loadData();
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Delete Category?")) {
      const filtered = categories.filter(c => c.id !== id);
      await settingsService.saveCategories(filtered);
      toast.success("Category deleted.");
      loadData();
    }
  };

  const handleMoveCategory = async (id, direction) => {
    const idx = categories.findIndex(c => c.id === id);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === categories.length - 1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...categories];
    
    // Swap order values
    const tempOrder = updated[idx].order;
    updated[idx].order = updated[targetIdx].order;
    updated[targetIdx].order = tempOrder;

    // Sort by order
    updated.sort((a, b) => a.order - b.order);

    // Re-assign order sequentially from 1 to categories.length
    updated.forEach((c, i) => {
       c.order = i + 1;
    });

    await settingsService.saveCategories(updated);
    await settingsService.addActivityLog(`Category order shifted: ${updated[idx].name.en} swapped with ${updated[targetIdx].name.en}`);
    loadData();
  };

  // BACKUP OPERATIONS
  const handleExportBackup = () => {
    try {
      const backupData = {
        products: products,
        orders: orders,
        settings: settings,
        timestamp: new Date().toISOString(),
        brand: "LELA"
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `lela_database_backup_${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Database exported successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export database backup.");
    }
  };

  const erpNotifications = useMemo(() => {
    const list = [];
    products.forEach(p => {
      if (p.stock <= 3) {
        list.push({
          id: `low_${p.id}`,
          type: "low_stock",
          message: `Low Stock: ${p.name?.en || 'Item'} has only ${p.stock} remaining.`,
          severity: "warning"
        });
      }
      if (p.stock < 0) {
        list.push({
          id: `neg_${p.id}`,
          type: "negative_stock",
          message: `Negative Stock: ${p.name?.en || 'Item'} is at ${p.stock}. Audit required!`,
          severity: "error"
        });
      }
    });

    expenses.forEach(e => {
      if (parseFloat(e.amount) > 50000) {
        list.push({
          id: `exp_${e.id}`,
          type: "large_expense",
          message: `Large Cost: Expense in ${e.category} exceeds 50,000 EGP.`,
          severity: "info"
        });
      }
    });

    wholesalers.forEach(w => {
      const wInvs = wholesaleInvoices.filter(i => i.wholesaler_id === w.id);
      const totalBilled = wInvs.reduce((acc, i) => acc + parseFloat(i.total), 0);
      if (w.credit_limit > 0 && totalBilled > w.credit_limit * 0.9) {
        list.push({
          id: `credit_${w.id}`,
          type: "credit_limit",
          message: `Credit Warning: ${w.company_name} is near credit ceiling.`,
          severity: "warning"
        });
      }
    });

    return list;
  }, [products, expenses, wholesalers, wholesaleInvoices]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    
    return {
      products: products.filter(p => p.name?.en?.toLowerCase().includes(q) || p.name?.ar?.toLowerCase().includes(q)),
      orders: orders.filter(o => o.id.toLowerCase().includes(q) || o.customer?.name?.toLowerCase().includes(q)),
      suppliers: suppliers.filter(s => s.name?.toLowerCase().includes(q)),
      wholesalers: wholesalers.filter(w => w.company_name?.toLowerCase().includes(q)),
      expenses: expenses.filter(e => e.category?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q))
    };
  }, [searchQuery, products, orders, suppliers, wholesalers, expenses]);

  const menuItems = [
    { id: "dashboard", name: language === "ar" ? "التحليلات والمقاييس" : "Store Analytics", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "erp_dashboard", name: language === "ar" ? "لوحة تحكم ERP" : "ERP Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "treasury", name: t("tabTreasury"), icon: <Archive className="w-4 h-4" /> },
    { id: "products", name: t("tabProducts"), icon: <ShoppingBag className="w-4 h-4" /> },
    { id: "categories", name: language === "ar" ? "التصنيفات" : "Categories", icon: <Layers className="w-4 h-4" /> },
    { id: "orders", name: t("tabOrders"), icon: <Receipt className="w-4 h-4" /> },
    { id: "purchases", name: language === "ar" ? "المشتريات" : "Purchases", icon: <Coins className="w-4 h-4" /> },
    { id: "inventory", name: language === "ar" ? "المخزون والتحكم" : "Inventory Ledger", icon: <Archive className="w-4 h-4" /> },
    { id: "shipping_accounting", name: language === "ar" ? "حسابات الشحن" : "Shipping Accounting", icon: <Scale className="w-4 h-4" /> },
    { id: "expenses", name: language === "ar" ? "المصاريف" : "Expenses", icon: <TrendingDown className="w-4 h-4" /> },
    { id: "suppliers", name: language === "ar" ? "الموردين" : "Suppliers", icon: <UserCheck className="w-4 h-4" /> },
    { id: "representatives", name: t("tabRepresentatives"), icon: <UserCheck className="w-4 h-4" /> },
    { id: "wholesalers", name: t("tabWholesalers"), icon: <UserCheck className="w-4 h-4" /> },
    { id: "reports", name: language === "ar" ? "التقارير المالية" : "Financial Reports", icon: <FileText className="w-4 h-4" /> },
    { id: "user_roles", name: t("tabUserRoles"), icon: <UserPlus className="w-4 h-4" /> },
    { id: "specialOrders", name: language === "ar" ? "الطلبات الخاصة" : "Special Sourcing", icon: <Layers className="w-4 h-4" /> },
    { id: "coupons", name: language === "ar" ? "كوبونات الخصم" : "Coupons", icon: <Receipt className="w-4 h-4" /> },
    { id: "shipping", name: t("tabShipping"), icon: <Scale className="w-4 h-4" /> },
    { id: "branding", name: t("tabSettings"), icon: <Palette className="w-4 h-4" /> },
    { id: "faq", name: t("tabFAQ"), icon: <HelpCircle className="w-4 h-4" /> },
    { id: "reviews", name: t("tabReviews"), icon: <MessageSquare className="w-4 h-4" /> }
  ];

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      if (userRole === "owner") return true;
      if (userRole === "manager") {
        return item.id !== "user_roles";
      }
      if (userRole === "warehouse") {
        return ["products", "inventory", "shipping_accounting", "orders"].includes(item.id);
      }
      if (userRole === "accountant") {
        return ["dashboard", "erp_dashboard", "products", "inventory", "shipping_accounting", "expenses", "suppliers", "reports", "representatives", "wholesalers", "treasury"].includes(item.id);
      }
      if (userRole === "sales") {
        return ["products", "orders", "wholesalers", "representatives"].includes(item.id);
      }
      if (userRole === "support") {
        return ["orders", "faq", "reviews"].includes(item.id);
      }
      return false;
    });
  }, [menuItems, userRole]);

  // AUTH VIEW GATING
  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh] px-6 font-sans">
        <div className="w-full max-w-md p-8 rounded-3xl bg-admin-card border border-admin-border shadow-2xl text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-primary/5 dark:bg-secondary/5 flex items-center justify-center text-primary dark:text-secondary mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-admin-text dark:text-white font-english uppercase tracking-wider">
              {t("adminLogin")}
            </h2>
            <p className="text-[10px] text-admin-text-secondary font-light">
              Log in with your administrator credentials to access the console
            </p>
          </div>
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-admin-text-secondary">Email Address</label>
              <input
                type="email"
                required
                placeholder="admin@lela.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-admin-border bg-admin-bg text-xs text-admin-text focus:outline-none focus:border-primary dark:text-white dark:border-secondary/10"
              />
            </div>
            
            <div className="space-y-1 relative">
              <label className="text-[10px] font-bold uppercase text-admin-text-secondary font-sans">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-admin-border bg-admin-bg text-xs text-admin-text focus:outline-none focus:border-primary dark:text-white pr-10 font-bold dark:border-secondary/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-admin-text-secondary hover:text-admin-text cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-admin-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-admin-border text-primary w-4 h-4"
                />
                Remember Me
              </label>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 mt-2 rounded-xl bg-primary hover:bg-primary/95 text-white font-semibold text-xs tracking-wider uppercase font-english transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loginLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                t("login")
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Loaded Settings verification
  if (!settings) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Dashboard calculations
  const completedOrders = orders.filter(o => o.status === "completed" || o.status === "delivered" || o.status === "completed");
  const totalSalesEGP = completedOrders.reduce((acc, o) => acc + (o.totalEGP || 0), 0);
  const totalSalesYER = completedOrders.reduce((acc, o) => acc + (o.totalYER || 0), 0);
  const lowStockCount = products.filter(p => p.stock !== undefined && p.stock <= 3).length;
  const pendingSpecialRequests = specialOrders.filter(so => so.status === "pending").length;

  const dashboardStats = {
    productsCount: products.length,
    ordersCount: orders.length,
    avgPrice: Math.round(products.reduce((acc, p) => acc + p.priceEGP, 0) / (products.length || 1)),
    totalSalesEGP,
    totalSalesYER,
    lowStockCount,
    pendingSpecialRequests
  };



  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 flex-1 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 border-b border-admin-border pb-4">
        <div>
          <h1 className="text-2xl font-light text-admin-text tracking-wide font-english uppercase">
            {t("adminDashboard")}
          </h1>
          <span className="text-[10px] text-admin-text-secondary font-light">
            LELA Concierge Operations ({userRole?.toUpperCase()})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Universal Search Input */}
          <div className="relative w-44 md:w-56">
            <input
              type="text"
              placeholder={language === "ar" ? "بحث شامل في النظام..." : "Search ERP..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 rounded-xl border border-primary/10 text-xs bg-brand-bg text-brand-text focus:outline-none focus:border-primary font-medium"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-brand-text/40 animate-pulse" />
          </div>

          {/* Notifications Center */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl border border-primary/10 hover:bg-primary/5 text-brand-text relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {erpNotifications.length > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-brand-card dark:bg-brand-dark-card border border-primary/15 rounded-2xl shadow-xl p-4 z-[999] space-y-2 text-[10px] text-brand-text font-medium">
                <h5 className="font-bold text-brand-text/60 uppercase tracking-wider mb-2">System Alerts ({erpNotifications.length})</h5>
                <div className="max-h-60 overflow-y-auto space-y-1.5">
                  {erpNotifications.map((notif) => (
                    <div key={notif.id} className={`p-2 rounded-xl border flex gap-1.5 items-start ${
                      notif.severity === 'error' ? 'bg-red-500/5 border-red-500/20 text-red-600' :
                      notif.severity === 'warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-600' : 'bg-blue-500/5 border-blue-500/20 text-blue-600'
                    }`}>
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{notif.message}</span>
                    </div>
                  ))}
                  {erpNotifications.length === 0 && (
                    <p className="text-center py-4 text-brand-text/40 italic">All systems clear. No warnings active.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Professional Excel Workbook Export */}
          <button
            onClick={() => excelExportService.exportErpLedger({
              products,
              orders,
              purchases,
              expenses,
              suppliers,
              representatives,
              wholesalers,
              wholesaleInvoices,
              shippingCompanies,
              treasuryTransactions,
              currency: "EGP",
              preparedBy: user?.email || "LELA Admin",
              language
            })}
            className="px-3.5 py-1.5 rounded-xl border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/5 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel Ledger
          </button>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl border border-red-500/20 text-red-500 text-xs font-semibold uppercase tracking-wider font-english hover:bg-red-500/5 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t("logout")}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <nav className="lg:col-span-3 space-y-1 bg-admin-card border border-admin-border p-4 rounded-2xl shadow-sm">
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 text-xs font-semibold uppercase tracking-wider px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === item.id
                  ? "bg-primary text-white shadow-md shadow-primary/10"
                  : "text-admin-text-secondary hover:bg-slate-55 hover:text-admin-text dark:hover:bg-slate-900/50"
              }`}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>

        {/* Dynamic Panel Area */}
        <main className="lg:col-span-9 bg-admin-card border border-admin-border p-6 rounded-2xl shadow-sm min-h-[50vh] transition-colors duration-550">
          {searchQuery && searchResults ? (
            <div className="space-y-6 animate-fade-in text-xs text-brand-text">
              <div className="flex justify-between items-center border-b border-primary/5 pb-2">
                <h3 className="font-bold uppercase tracking-wider text-brand-text/75">Universal Search Results</h3>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-primary hover:underline font-bold"
                >
                  Clear Search
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Products */}
                <div className="space-y-2">
                  <h4 className="font-bold text-[10px] text-brand-text/50 uppercase tracking-widest">Products ({searchResults.products.length})</h4>
                  <div className="space-y-1.5">
                    {searchResults.products.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => { setActiveTab("products"); setSearchQuery(""); }}
                        className="p-2.5 rounded-xl border border-primary/5 bg-brand-bg/10 hover:bg-primary/5 cursor-pointer flex justify-between items-center"
                      >
                        <span className="font-semibold">{p.name?.en}</span>
                        <span className="font-english font-bold text-primary">{p.priceEGP} EGP</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Orders */}
                <div className="space-y-2">
                  <h4 className="font-bold text-[10px] text-brand-text/50 uppercase tracking-widest">Orders ({searchResults.orders.length})</h4>
                  <div className="space-y-1.5">
                    {searchResults.orders.map(o => (
                      <div 
                        key={o.id} 
                        onClick={() => { setActiveTab("orders"); setSearchQuery(""); }}
                        className="p-2.5 rounded-xl border border-primary/5 bg-brand-bg/10 hover:bg-primary/5 cursor-pointer flex justify-between items-center"
                      >
                        <span className="font-bold font-english">{o.id}</span>
                        <span className="font-semibold">{o.customer?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Wholesalers */}
                <div className="space-y-2">
                  <h4 className="font-bold text-[10px] text-brand-text/50 uppercase tracking-widest">Wholesale B2B ({searchResults.wholesalers.length})</h4>
                  <div className="space-y-1.5">
                    {searchResults.wholesalers.map(w => (
                      <div 
                        key={w.id} 
                        onClick={() => { setActiveTab("wholesalers"); setSearchQuery(""); }}
                        className="p-2.5 rounded-xl border border-primary/5 bg-brand-bg/10 hover:bg-primary/5 cursor-pointer flex justify-between items-center"
                      >
                        <span className="font-semibold">{w.company_name}</span>
                        <span className="font-english font-bold text-primary">{w.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suppliers */}
                <div className="space-y-2">
                  <h4 className="font-bold text-[10px] text-brand-text/50 uppercase tracking-widest">Suppliers Directory ({searchResults.suppliers.length})</h4>
                  <div className="space-y-1.5">
                    {searchResults.suppliers.map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => { setActiveTab("suppliers"); setSearchQuery(""); }}
                        className="p-2.5 rounded-xl border border-primary/5 bg-brand-bg/10 hover:bg-primary/5 cursor-pointer flex justify-between items-center"
                      >
                        <span className="font-semibold">{s.name}</span>
                        <span className="font-english font-bold text-primary">{s.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
          
          {/* TAB 1: METRICS DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fade-in font-sans">
              {/* Header with Export */}
              <div className="flex justify-between items-center border-b border-primary/5 pb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">
                  Concierge Metrics & Analytics
                </h3>
                <button
                  onClick={handleExportBackup}
                  className="px-3.5 py-1.5 rounded-xl border border-primary/20 text-primary dark:text-secondary text-[10px] font-bold uppercase tracking-wider font-english hover:bg-primary/5 flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Backup Data
                </button>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
                <div className="p-6 rounded-2xl bg-brand-bg dark:bg-brand-dark-card border border-primary/5 text-center flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-text/40">
                    Total Completed Sales
                  </span>
                  <div className="text-lg font-extrabold text-primary dark:text-secondary font-english mt-2">
                    {dashboardStats.totalSalesEGP.toLocaleString()} EGP
                  </div>
                  <div className="text-[9px] text-brand-text/50 font-english mt-0.5">
                    {dashboardStats.totalSalesYER.toLocaleString()} YER
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-brand-bg dark:bg-brand-dark-card border border-primary/5 text-center flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-text/40">
                    {t("productsCount")}
                  </span>
                  <div className="text-3xl font-extrabold text-primary dark:text-secondary font-english mt-2">
                    {dashboardStats.productsCount}
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-brand-bg dark:bg-brand-dark-card border border-primary/5 text-center flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-text/40">
                    {t("ordersCount")}
                  </span>
                  <div className="text-3xl font-extrabold text-primary dark:text-secondary font-english mt-2">
                    {dashboardStats.ordersCount}
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-brand-bg dark:bg-brand-dark-card border border-primary/5 text-center flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-text/40">
                    Low Stock Alerts
                  </span>
                  <div className={`text-3xl font-extrabold mt-2 font-english ${
                    dashboardStats.lowStockCount > 0 ? "text-red-500 animate-pulse font-bold" : "text-primary dark:text-secondary"
                  }`}>
                    {dashboardStats.lowStockCount}
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-brand-bg dark:bg-brand-dark-card border border-primary/5 text-center flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-text/40">
                    Sourcing Tasks
                  </span>
                  <div className={`text-3xl font-extrabold mt-2 font-english ${
                    dashboardStats.pendingSpecialRequests > 0 ? "text-amber-500 font-bold" : "text-primary dark:text-secondary"
                  }`}>
                    {dashboardStats.pendingSpecialRequests}
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Category distribution horizontal chart */}
                <div className="p-6 rounded-2xl bg-brand-bg/30 dark:bg-brand-dark-card/30 border border-primary/5 space-y-4">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-brand-text/50">
                    Product Categories Distribution
                  </h4>
                  <div className="space-y-3.5">
                    {categories.slice(0, 5).map((cat, i) => {
                      const count = products.filter(p => p.category === cat.name.en).length;
                      const maxCount = Math.max(...categories.map(c => products.filter(p => p.category === c.name.en).length), 1);
                      const percentage = (count / maxCount) * 100;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-brand-text/70 dark:text-brand-dark-text/70">{cat.name[language] || cat.name.en}</span>
                            <span className="font-english text-primary dark:text-secondary">{count} items</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-primary/5 dark:bg-secondary/5 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {categories.length === 0 && (
                      <p className="text-xs text-brand-text/40 text-center py-4">No categories configured yet.</p>
                    )}
                  </div>
                </div>

                {/* Orders status side distribution */}
                <div className="p-6 rounded-2xl bg-brand-bg/30 dark:bg-brand-dark-card/30 border border-primary/5 space-y-4">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-brand-text/50">
                    Concierge Order Status Distribution
                  </h4>
                  <div className="flex flex-col justify-center space-y-4 h-full">
                    <div className="flex items-center justify-between border-b border-primary/5 pb-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                        <span>Pending Checkouts</span>
                      </div>
                      <span className="font-bold font-english">{orders.filter(o => o.status === "pending").length}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-primary/5 pb-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span>Completed Orders</span>
                      </div>
                      <span className="font-bold font-english">{orders.filter(o => o.status === "completed").length}</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span>Cancelled Orders</span>
                      </div>
                      <span className="font-bold font-english">{orders.filter(o => o.status === "cancelled").length}</span>
                    </div>
                  </div>
                </div>

                {/* Audit Log Activity Tracker */}
                <div className="p-6 rounded-2xl bg-brand-bg/30 dark:bg-brand-dark-card/30 border border-primary/5 space-y-4 flex flex-col h-[220px]">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-brand-text/50">
                    Concierge Audit Logs
                  </h4>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2 text-[10px]">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="border-b border-primary/5 pb-1.5 last:border-0">
                        <p className="text-brand-text dark:text-brand-dark-text font-medium">{log.message}</p>
                        <span className="text-[8px] text-brand-text/40 font-english block mt-0.5">{log.timestamp}</span>
                      </div>
                    ))}
                    {activityLogs.length === 0 && (
                      <p className="text-xs text-brand-text/40 text-center py-8 font-light">No activity logs recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order quick overview */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">
                  Recent Concierge Requests
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-primary/5 text-brand-text/40 font-bold uppercase">
                        <th className="py-2.5">{t("orderId")}</th>
                        <th className="py-2.5">{t("customer")}</th>
                        <th className="py-2.5">{t("total")}</th>
                        <th className="py-2.5">{t("status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id} className="border-b border-primary/5 hover:bg-brand-bg/20">
                          <td className="py-3 font-semibold font-english">{o.id}</td>
                          <td className="py-3">{o.customer.name}</td>
                          <td className="py-3 font-bold font-english">
                            {o.selectedCurrency === "SAR"
                              ? `${Math.round(o.totalEGP * (o.exchangeRate || 11.5) / 140).toLocaleString()} SAR`
                              : `${Math.round(o.totalEGP * (o.exchangeRate || 11.5)).toLocaleString()} YER`}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              o.status === "completed" ? "bg-green-500/10 text-green-500" : o.status === "cancelled" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
                            }`}>
                              {t(o.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center py-6 text-brand-text/30 font-light">No orders placed yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ERP DASHBOARD */}
          {activeTab === "erp_dashboard" && (
            <ErpDashboard 
              products={products} 
              orders={orders} 
              purchases={purchases} 
              expenses={expenses} 
              representatives={representatives} 
              language={language} 
            />
          )}

          {/* TAB: PURCHASES */}
          {activeTab === "purchases" && (
            <ErpPurchases 
              products={products} 
              suppliers={suppliers} 
              purchases={purchases} 
              loadData={loadData} 
              language={language} 
            />
          )}

          {/* TAB: INVENTORY */}
          {activeTab === "inventory" && (
            <ErpInventory 
              products={products} 
              orders={orders} 
              purchases={purchases} 
              movements={movements} 
              loadData={loadData} 
              language={language} 
            />
          )}

          {/* TAB: SHIPPING ACCOUNTING */}
          {activeTab === "shipping_accounting" && (
            <ErpShipping 
              shippingCompanies={shippingCompanies} 
              loadData={loadData} 
              language={language} 
            />
          )}

          {/* TAB: EXPENSES */}
          {activeTab === "expenses" && (
            <ErpExpenses 
              expenses={expenses} 
              loadData={loadData} 
              language={language} 
            />
          )}

          {/* TAB: SUPPLIERS */}
          {activeTab === "suppliers" && (
            <ErpSuppliers 
              suppliers={suppliers} 
              purchases={purchases} 
              loadData={loadData} 
              language={language} 
            />
          )}

          {/* TAB: FINANCIAL REPORTS */}
          {activeTab === "reports" && (
            <ErpReports 
              products={products} 
              orders={orders} 
              purchases={purchases} 
              expenses={expenses} 
              language={language} 
            />
          )}

          {/* TAB 2: PRODUCTS CRUD */}
          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">
                  Manage Products List
                </h3>
                <button
                  onClick={handleOpenAddProduct}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold uppercase tracking-wider font-english hover:bg-primary/95 flex items-center gap-1.5 transition-all shadow-md shadow-primary/10"
                >
                  <Plus className="w-4 h-4" />
                  {t("addProduct")}
                </button>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-primary/5 text-brand-text/40 font-bold uppercase">
                      <th className="py-2.5">Image</th>
                      <th className="py-2.5">Name</th>
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5">Price (EGP)</th>
                      <th className="py-2.5">Weight</th>
                      <th className="py-2.5 text-center">{t("actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-b border-primary/5 hover:bg-brand-bg/20">
                        <td className="py-3">
                          <img src={p.images[0]} alt="" className="w-10 h-12 object-cover rounded-lg bg-brand-bg/50" />
                        </td>
                        <td className="py-3 font-semibold">{p.name.en}</td>
                        <td className="py-3">{p.category}</td>
                        <td className="py-3 font-bold font-english">{p.priceEGP.toLocaleString()} EGP</td>
                        <td className="py-3 font-english">{p.weight} KG</td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 rounded-lg hover:bg-primary/5 text-primary"
                              title="Edit product"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/5 text-red-500"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2.5: CATEGORIES CRUD */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">
                  Manage Categories List
                </h3>
                <button
                  onClick={handleOpenAddCategory}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold uppercase tracking-wider font-english hover:bg-primary/95 flex items-center gap-1.5 transition-all shadow-md shadow-primary/10"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </button>
              </div>

              {/* Categories Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left font-sans">
                  <thead>
                    <tr className="border-b border-primary/5 text-brand-text/40 font-bold uppercase">
                      <th className="py-2.5">Image</th>
                      <th className="py-2.5">Name (EN)</th>
                      <th className="py-2.5">Name (AR)</th>
                      <th className="py-2.5 text-center">Display Order</th>
                      <th className="py-2.5 text-center">Status</th>
                      <th className="py-2.5 text-center">{t("actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat, catIndex) => (
                      <tr key={cat.id} className="border-b border-primary/5 hover:bg-brand-bg/10 align-middle">
                        <td className="py-3">
                          <img
                            src={cat.image}
                            alt=""
                            className="w-10 h-10 object-cover rounded-lg border border-primary/5 bg-brand-bg/50"
                          />
                        </td>
                        <td className="py-3 font-semibold">{cat.name.en}</td>
                        <td className="py-3 font-semibold text-right pr-4">{cat.name.ar}</td>
                        <td className="py-3 text-center font-english">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              disabled={catIndex === 0}
                              onClick={() => handleMoveCategory(cat.id, "up")}
                              className="px-1.5 py-0.5 rounded bg-primary/5 dark:bg-secondary/5 hover:bg-primary/15 disabled:opacity-20 text-brand-text dark:text-brand-dark-text text-[8px] cursor-pointer transition-all"
                              title="Move Up"
                            >
                              ▲
                            </button>
                            <span className="font-bold min-w-4 text-center">{cat.order}</span>
                            <button
                              disabled={catIndex === categories.length - 1}
                              onClick={() => handleMoveCategory(cat.id, "down")}
                              className="px-1.5 py-0.5 rounded bg-primary/5 dark:bg-secondary/5 hover:bg-primary/15 disabled:opacity-20 text-brand-text dark:text-brand-dark-text text-[8px] cursor-pointer transition-all"
                              title="Move Down"
                            >
                              ▼
                            </button>
                          </div>
                        </td>
                        <td className="py-3 text-center font-sans">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            cat.hidden ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                          }`}>
                            {cat.hidden ? "Hidden" : "Visible"}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleOpenEditCategory(cat)}
                              className="p-1.5 rounded-lg hover:bg-primary/5 text-primary cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/5 text-red-500 cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-brand-text/30 font-light">No categories created yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS LISTING */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">
                All Concierge Checkout Records
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-primary/5 text-brand-text/40 font-bold uppercase">
                      <th className="py-2.5">Order ID</th>
                      <th className="py-2.5">Customer & Delivery</th>
                      <th className="py-2.5">Items Purchased</th>
                      <th className="py-2.5">Cost details</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-center">{t("actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id} className="border-b border-primary/5 hover:bg-brand-bg/10 align-top">
                        <td className="py-4 font-bold font-english">{o.id}</td>
                        <td className="py-4 space-y-1">
                          <p className="font-semibold">{o.customer.name}</p>
                          <p className="text-[10px] text-brand-text/50 font-english">{o.customer.phone}</p>
                          <p className="text-[10px] text-brand-text/50 font-medium">
                            {o.customer.governorate} - {o.customer.address}
                          </p>
                        </td>
                        <td className="py-4">
                          <ul className="list-disc list-inside space-y-1 font-light text-[10px]">
                            {o.items.map((item, idx) => (
                              <li key={idx} className="line-clamp-1">
                                {item.name} x {item.quantity} {item.size ? `(${item.size})` : ""}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="py-4 space-y-1 font-sans">
                          <p className="font-bold text-primary font-english">{Math.round(o.totalYER).toLocaleString()} YER</p>
                          <p className="text-[9px] text-brand-text/40">Cost: {o.totalEGP.toLocaleString()} EGP</p>
                          {o.couponCode && (
                            <p className="text-[8px] text-green-500 font-extrabold uppercase tracking-wide">
                              Coupon: {o.couponCode} (-{o.discountAmount || o.discount || 10}%)
                            </p>
                          )}
                        </td>
                        <td className="py-4 font-sans">
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border focus:outline-none bg-admin-bg text-admin-text ${
                              o.status === "completed" 
                                ? "bg-green-500/10 text-green-500 border-green-500/20" 
                                : o.status === "cancelled" 
                                  ? "bg-red-500/10 text-red-500 border-red-500/20" 
                                  : o.status === "sourced"
                                    ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                    : o.status === "shipped"
                                      ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                                      : o.status === "in_transit"
                                        ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                                        : o.status === "arrived"
                                          ? "bg-teal-500/10 text-teal-500 border-teal-500/20"
                                          : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                            }`}
                          >
                            <option value="pending">Pending Sourcing</option>
                            <option value="sourced">Cairo Sourced</option>
                            <option value="shipped">Shipped</option>
                            <option value="in_transit">In Transit</option>
                            <option value="arrived">Arrived Yemen</option>
                            <option value="completed">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-4 text-center">
                          <button
                            onClick={() => handleDeleteOrder(o.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/5 text-red-500"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-brand-text/30 font-light">No checkout requests received yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: SPECIAL ORDERS SOURCING */}
          {activeTab === "specialOrders" && (
            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">
                Special Sourcing Sourcing Concierge Requests
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-primary/5 text-brand-text/40 font-bold uppercase">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Customer details</th>
                      <th className="py-2.5">Requested Item Details</th>
                      <th className="py-2.5">Weight</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {specialOrders.map(so => (
                      <tr key={so.id} className="border-b border-primary/5 hover:bg-brand-bg/10 align-top">
                        <td className="py-4 font-english">{so.date}</td>
                        <td className="py-4 space-y-1">
                          <p className="font-semibold">{so.customer.name}</p>
                          <p className="text-[10px] text-brand-text/50 font-english">{so.customer.phone}</p>
                        </td>
                        <td className="py-4 space-y-1 max-w-xs">
                          <p className="font-light whitespace-pre-wrap">{so.description}</p>
                          {so.imageUrl && (
                            <a href={so.imageUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline font-semibold block mt-1">
                              View Reference Image ➔
                            </a>
                          )}
                        </td>
                        <td className="py-4 font-english">{so.weight} KG</td>
                        <td className="py-4">
                          <select
                            value={so.status}
                            onChange={(e) => handleUpdateSpecialOrderStatus(so.id, e.target.value)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border focus:outline-none bg-admin-bg text-admin-text ${
                              so.status === "completed"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : so.status === "cancelled"
                                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                                  : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                            }`}
                          >
                            <option value="pending">Pending Sourcing</option>
                            <option value="sourced">Cairo Sourced</option>
                            <option value="shipped">In Transit</option>
                            <option value="arrived">Arrived Yemen</option>
                            <option value="completed">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-4 text-center">
                          <button
                            onClick={() => handleDeleteSpecialOrder(so.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/5 text-red-500 cursor-pointer"
                            title="Delete Sourcing Request"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {specialOrders.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-brand-text/30 font-light">No special sourcing requests logged yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: COUPONS MANAGEMENT */}
          {activeTab === "coupons" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-primary/5 pb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">
                  Discount Coupons Management
                </h3>
                <button
                  onClick={handleOpenAddCoupon}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-[10px] font-bold uppercase tracking-wider font-english hover:bg-primary/95 flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Coupon Code
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-primary/5 text-brand-text/40 font-bold uppercase">
                      <th className="py-2.5">Code</th>
                      <th className="py-2.5">Discount Percentage</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map(c => (
                      <tr key={c.code} className="border-b border-primary/5 hover:bg-brand-bg/10 font-sans">
                        <td className="py-4 font-bold font-english text-primary">{c.code}</td>
                        <td className="py-4 font-english">{c.discount}% Discount</td>
                        <td className="py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            c.active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                          }`}>
                            {c.active ? "Active" : "Expired / Disabled"}
                          </span>
                        </td>
                        <td className="py-4 text-center space-x-2">
                          <button
                            onClick={() => handleOpenEditCoupon(c)}
                            className="p-1.5 rounded-lg hover:bg-primary/5 text-primary cursor-pointer"
                            title="Edit Coupon Settings"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(c.code)}
                            className="p-1.5 rounded-lg hover:bg-red-500/5 text-red-500 cursor-pointer"
                            title="Delete Coupon Code"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {coupons.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-8 text-brand-text/30 font-light">No discount coupons configured.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SHIPPING & CURRENCY */}
          {activeTab === "shipping" && (
            <form onSubmit={handleShippingSubmit} className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80 mb-4">
                Configure Concierge Fees & Currency Exchange
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-text/75">{t("shippingRatePersonal")}</label>
                  <input
                    type="number"
                    value={shippingForm.personalCare}
                    onChange={(e) => setShippingForm(prev => ({ ...prev, personalCare: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-primary/10 text-xs font-english font-medium text-brand-text dark:text-brand-dark-text"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-text/75">{t("shippingRateClothing")}</label>
                  <input
                    type="number"
                    value={shippingForm.clothingHome}
                    onChange={(e) => setShippingForm(prev => ({ ...prev, clothingHome: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-primary/10 text-xs font-english font-medium text-brand-text dark:text-brand-dark-text"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-text/75">{t("exchangeRate")}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={shippingForm.egpToYerRate}
                      onChange={(e) => setShippingForm(prev => ({ ...prev, egpToYerRate: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-primary/10 text-xs font-english font-bold text-primary dark:text-secondary"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-brand-text/40">
                      YER / EGP
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-text/75">Exchange Rate (1 SAR = YER)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={shippingForm.yerToSarRate}
                      onChange={(e) => setShippingForm(prev => ({ ...prev, yerToSarRate: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-primary/10 text-xs font-english font-bold text-primary dark:text-secondary"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-brand-text/40">
                      YER / SAR
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-primary text-white text-xs font-semibold uppercase tracking-wider font-english hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                Save Rates Configuration
              </button>
            </form>
          )}

          {/* TAB 5: BRANDING & HOME CONTEXT */}
          {activeTab === "branding" && (
            <div className="space-y-8 font-sans">
              <form onSubmit={handleBrandingSubmit} className="space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80 border-b border-primary/5 pb-2">
                  Brand Name & Asset Management
                </h3>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-text/75">Website Name</label>
                  <input
                    type="text"
                    value={brandingForm.websiteName}
                    onChange={(e) => setBrandingForm(prev => ({ ...prev, websiteName: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-primary/10 bg-admin-bg text-admin-text text-xs"
                    placeholder="e.g. LELA STORE"
                  />
                </div>

                {/* Uploadable Brand Assets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Light Logo */}
                  <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-primary/5">
                    <label className="text-[10px] font-bold uppercase text-brand-text/60">Light Logo</label>
                    <div className="aspect-video bg-white rounded-lg flex items-center justify-center border p-2 mb-2">
                      {brandingForm.logoUrl ? (
                        <img src={brandingForm.logoUrl} alt="Light Logo" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[8px] text-brand-text/30">No Logo</span>
                      )}
                    </div>
                    <label htmlFor="logoUrl-upload" className="block w-full py-1.5 text-center bg-primary text-white rounded text-[10px] font-bold cursor-pointer hover:opacity-90">
                      Upload
                    </label>
                    <input id="logoUrl-upload" type="file" onChange={(e) => handleLogoUpload(e, "logoUrl")} className="hidden" />
                    <input
                      type="text"
                      value={brandingForm.logoUrl}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                      className="w-full mt-2 px-2 py-1 rounded text-[9px] border font-english bg-admin-bg text-admin-text"
                      placeholder="Or paste URL"
                    />
                  </div>

                  {/* Dark Logo */}
                  <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-primary/5">
                    <label className="text-[10px] font-bold uppercase text-brand-text/60">Dark Logo</label>
                    <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 p-2 mb-2">
                      {brandingForm.logoDarkUrl ? (
                        <img src={brandingForm.logoDarkUrl} alt="Dark Logo" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[8px] text-white/30">No Logo</span>
                      )}
                    </div>
                    <label htmlFor="logoDarkUrl-upload" className="block w-full py-1.5 text-center bg-primary text-white rounded text-[10px] font-bold cursor-pointer hover:opacity-90">
                      Upload
                    </label>
                    <input id="logoDarkUrl-upload" type="file" onChange={(e) => handleLogoUpload(e, "logoDarkUrl")} className="hidden" />
                    <input
                      type="text"
                      value={brandingForm.logoDarkUrl}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, logoDarkUrl: e.target.value }))}
                      className="w-full mt-2 px-2 py-1 rounded text-[9px] border font-english bg-admin-bg text-admin-text"
                      placeholder="Or paste URL"
                    />
                  </div>

                  {/* Favicon */}
                  <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-primary/5">
                    <label className="text-[10px] font-bold uppercase text-brand-text/60">Favicon</label>
                    <div className="aspect-video bg-white rounded-lg flex items-center justify-center border p-2 mb-2">
                      {brandingForm.faviconUrl ? (
                        <img src={brandingForm.faviconUrl} alt="Favicon" className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="text-[8px] text-brand-text/30">No Icon</span>
                      )}
                    </div>
                    <label htmlFor="faviconUrl-upload" className="block w-full py-1.5 text-center bg-primary text-white rounded text-[10px] font-bold cursor-pointer hover:opacity-90">
                      Upload
                    </label>
                    <input id="faviconUrl-upload" type="file" onChange={(e) => handleLogoUpload(e, "faviconUrl")} className="hidden" />
                    <input
                      type="text"
                      value={brandingForm.faviconUrl}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, faviconUrl: e.target.value }))}
                      className="w-full mt-2 px-2 py-1 rounded text-[9px] border font-english bg-admin-bg text-admin-text"
                      placeholder="Or paste URL"
                    />
                  </div>

                  {/* Loading Logo */}
                  <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-primary/5">
                    <label className="text-[10px] font-bold uppercase text-brand-text/60">Loading Logo</label>
                    <div className="aspect-video bg-white rounded-lg flex items-center justify-center border p-2 mb-2">
                      {brandingForm.loadingLogoUrl ? (
                        <img src={brandingForm.loadingLogoUrl} alt="Loading Logo" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[8px] text-brand-text/30">No Logo</span>
                      )}
                    </div>
                    <label htmlFor="loadingLogoUrl-upload" className="block w-full py-1.5 text-center bg-primary text-white rounded text-[10px] font-bold cursor-pointer hover:opacity-90">
                      Upload
                    </label>
                    <input id="loadingLogoUrl-upload" type="file" onChange={(e) => handleLogoUpload(e, "loadingLogoUrl")} className="hidden" />
                    <input
                      type="text"
                      value={brandingForm.loadingLogoUrl}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, loadingLogoUrl: e.target.value }))}
                      className="w-full mt-2 px-2 py-1 rounded text-[9px] border font-english bg-admin-bg text-admin-text"
                      placeholder="Or paste URL"
                    />
                  </div>

                  {/* Browser Icon */}
                  <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-primary/5">
                    <label className="text-[10px] font-bold uppercase text-brand-text/60">Browser Icon</label>
                    <div className="aspect-video bg-white rounded-lg flex items-center justify-center border p-2 mb-2">
                      {brandingForm.browserIconUrl ? (
                        <img src={brandingForm.browserIconUrl} alt="Browser Icon" className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="text-[8px] text-brand-text/30">No Icon</span>
                      )}
                    </div>
                    <label htmlFor="browserIconUrl-upload" className="block w-full py-1.5 text-center bg-primary text-white rounded text-[10px] font-bold cursor-pointer hover:opacity-90">
                      Upload
                    </label>
                    <input id="browserIconUrl-upload" type="file" onChange={(e) => handleLogoUpload(e, "browserIconUrl")} className="hidden" />
                    <input
                      type="text"
                      value={brandingForm.browserIconUrl}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, browserIconUrl: e.target.value }))}
                      className="w-full mt-2 px-2 py-1 rounded text-[9px] border font-english bg-admin-bg text-admin-text"
                      placeholder="Or paste URL"
                    />
                  </div>
                </div>

                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80 border-b border-primary/5 pb-2">
                  Edit Homepage Banner Text
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-brand-text/75">{t("editHeroTitleEn")}</label>
                    <input
                      type="text"
                      value={brandingForm.heroTitleEn}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, heroTitleEn: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-primary/10 text-xs text-brand-text bg-admin-bg dark:text-brand-dark-text dark:border-secondary/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-brand-text/75">{t("editHeroTitleAr")}</label>
                    <input
                      type="text"
                      value={brandingForm.heroTitleAr}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, heroTitleAr: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-primary/10 text-xs text-brand-text bg-admin-bg dark:text-brand-dark-text dark:border-secondary/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-brand-text/75">{t("editHeroSubtitleEn")}</label>
                    <textarea
                      rows="3"
                      value={brandingForm.heroSubtitleEn}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, heroSubtitleEn: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-primary/10 text-xs text-brand-text bg-admin-bg dark:text-brand-dark-text resize-none dark:border-secondary/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-brand-text/75">{t("editHeroSubtitleAr")}</label>
                    <textarea
                      rows="3"
                      value={brandingForm.heroSubtitleAr}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, heroSubtitleAr: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-primary/10 text-xs text-brand-text bg-admin-bg dark:text-brand-dark-text resize-none dark:border-secondary/10"
                    />
                  </div>
                </div>

                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80 border-b border-primary/5 pb-2 pt-4">
                  Support Contact Details & Social Media Links
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-brand-text/75">{t("contactPhone1")}</label>
                    <input
                      type="text"
                      value={brandingForm.phoneEgypt}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, phoneEgypt: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-primary/10 text-xs text-brand-text bg-admin-bg dark:text-brand-dark-text font-english dark:border-secondary/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-brand-text/75">{t("contactPhone2")}</label>
                    <input
                      type="text"
                      value={brandingForm.phoneYemen}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, phoneYemen: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-primary/10 text-xs text-brand-text bg-admin-bg dark:text-brand-dark-text font-english dark:border-secondary/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-brand-text/75">{t("contactEmail")}</label>
                    <input
                      type="email"
                      value={brandingForm.email}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-primary/10 text-xs text-brand-text bg-admin-bg dark:text-brand-dark-text font-english dark:border-secondary/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-brand-text/75">{t("contactInstagram")}</label>
                    <input
                      type="text"
                      value={brandingForm.instagram}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, instagram: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-primary/10 text-xs text-brand-text bg-admin-bg dark:text-brand-dark-text font-english dark:border-secondary/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-brand-text/75">{t("contactFacebook")}</label>
                    <input
                      type="text"
                      value={brandingForm.facebook}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, facebook: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-primary/10 text-xs text-brand-text bg-admin-bg dark:text-brand-dark-text font-english dark:border-secondary/10"
                    />
                  </div>
                </div>

                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80 border-b border-primary/5 pb-2 pt-4">
                  Theme Colors Configuration (Light Mode)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-brand-text/75">{t("brandPrimary")}</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={brandingForm.primaryColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={brandingForm.primaryColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-full px-2 py-1 rounded-lg border text-[10px] font-english bg-admin-bg text-admin-text dark:border-secondary/10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-brand-text/75">{t("brandSecondary")}</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={brandingForm.secondaryColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={brandingForm.secondaryColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-full px-2 py-1 rounded-lg border text-[10px] font-english bg-admin-bg text-admin-text dark:border-secondary/10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-brand-text/75">Accent Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={brandingForm.accentColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={brandingForm.accentColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="w-full px-2 py-1 rounded-lg border text-[10px] font-english bg-admin-bg text-admin-text dark:border-secondary/10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-brand-text/75">{t("brandBg")}</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={brandingForm.backgroundColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={brandingForm.backgroundColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="w-full px-2 py-1 rounded-lg border text-[10px] font-english bg-admin-bg text-admin-text dark:border-secondary/10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-brand-text/75">{t("brandText")}</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={brandingForm.textColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, textColor: e.target.value }))}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={brandingForm.textColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, textColor: e.target.value }))}
                        className="w-full px-2 py-1 rounded-lg border text-[10px] font-english bg-admin-bg text-admin-text dark:border-secondary/10"
                      />
                    </div>
                  </div>
                </div>

                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80 border-b border-primary/5 pb-2 pt-4">
                  Theme Colors Configuration (Dark Mode)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-brand-text/75">Dark Primary</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={brandingForm.darkPrimaryColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, darkPrimaryColor: e.target.value }))}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={brandingForm.darkPrimaryColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, darkPrimaryColor: e.target.value }))}
                        className="w-full px-2 py-1 rounded-lg border text-[10px] font-english bg-admin-bg text-admin-text dark:border-secondary/10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-brand-text/75">Dark Secondary</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={brandingForm.darkSecondaryColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, darkSecondaryColor: e.target.value }))}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={brandingForm.darkSecondaryColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, darkSecondaryColor: e.target.value }))}
                        className="w-full px-2 py-1 rounded-lg border text-[10px] font-english bg-admin-bg text-admin-text dark:border-secondary/10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-brand-text/75">Dark Accent</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={brandingForm.darkAccentColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, darkAccentColor: e.target.value }))}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={brandingForm.darkAccentColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, darkAccentColor: e.target.value }))}
                        className="w-full px-2 py-1 rounded-lg border text-[10px] font-english bg-admin-bg text-admin-text dark:border-secondary/10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-brand-text/75">Dark Background</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={brandingForm.darkBackgroundColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, darkBackgroundColor: e.target.value }))}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={brandingForm.darkBackgroundColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, darkBackgroundColor: e.target.value }))}
                        className="w-full px-2 py-1 rounded-lg border text-[10px] font-english bg-admin-bg text-admin-text dark:border-secondary/10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-brand-text/75">Dark Text</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={brandingForm.darkTextColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, darkTextColor: e.target.value }))}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={brandingForm.darkTextColor}
                        onChange={(e) => setBrandingForm(prev => ({ ...prev, darkTextColor: e.target.value }))}
                        className="w-full px-2 py-1 rounded-lg border text-[10px] font-english bg-admin-bg text-admin-text dark:border-secondary/10"
                      />
                    </div>
                  </div>
                </div>

                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80 border-b border-primary/5 pb-2 pt-4">
                  Theme Elements Layout Settings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-text/60">Button Border Radius</label>
                    <input
                      type="text"
                      value={brandingForm.buttonRadius}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, buttonRadius: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-admin-bg text-admin-text text-xs dark:border-secondary/10"
                      placeholder="e.g. 12px or 9999px"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-text/60">Border Width</label>
                    <input
                      type="text"
                      value={brandingForm.borderWidth}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, borderWidth: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-admin-bg text-admin-text text-xs dark:border-secondary/10"
                      placeholder="e.g. 1px or 2px"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-text/60">Card Background (Light)</label>
                    <input
                      type="text"
                      value={brandingForm.cardBg}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, cardBg: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-admin-bg text-admin-text text-xs font-english dark:border-secondary/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-text/60">Card Background (Dark)</label>
                    <input
                      type="text"
                      value={brandingForm.darkCardBg}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, darkCardBg: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-admin-bg text-admin-text text-xs font-english dark:border-secondary/10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-primary text-white text-xs font-semibold uppercase tracking-wider font-english hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Website Branding & Styles
                </button>
              </form>

              {/* Announcement Bar Section */}
              <div className="pt-6 border-t border-primary/5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">
                  Announcement Bar Configuration
                </h3>
                <div className="bg-brand-bg/10 dark:bg-brand-dark-bg/25 border border-primary/5 p-5 rounded-2xl space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="annEnabled"
                        checked={announcementConfig.enabled}
                        onChange={(e) => setAnnouncementConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                        className="w-4 h-4 text-primary border-primary/10 rounded focus:ring-primary/20"
                      />
                      <label htmlFor="annEnabled" className="font-semibold text-brand-text dark:text-brand-dark-text">Enable Bar</label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="annScroll"
                        checked={announcementConfig.scrolling}
                        onChange={(e) => setAnnouncementConfig(prev => ({ ...prev, scrolling: e.target.checked }))}
                        className="w-4 h-4 text-primary border-primary/10 rounded focus:ring-primary/20"
                      />
                      <label htmlFor="annScroll" className="font-semibold text-brand-text dark:text-brand-dark-text">Scrolling Marquee</label>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-text/60">Background Color</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={announcementConfig.backgroundColor}
                          onChange={(e) => setAnnouncementConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                          className="w-6 h-6 border-0 rounded cursor-pointer p-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={announcementConfig.backgroundColor}
                          onChange={(e) => setAnnouncementConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                          className="w-full px-2 py-1 rounded border border-primary/10 bg-admin-bg text-[10px]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-text/60">Text Color</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={announcementConfig.textColor}
                          onChange={(e) => setAnnouncementConfig(prev => ({ ...prev, textColor: e.target.value }))}
                          className="w-6 h-6 border-0 rounded cursor-pointer p-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={announcementConfig.textColor}
                          onChange={(e) => setAnnouncementConfig(prev => ({ ...prev, textColor: e.target.value }))}
                          className="w-full px-2 py-1 rounded border border-primary/10 bg-admin-bg text-[10px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-[11px] uppercase tracking-wider text-brand-text/60">Notice Items</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAnnItem(null);
                          setAnnItemForm({ textEn: "", textAr: "", startDate: "", endDate: "" });
                          setShowAnnModal(true);
                        }}
                        className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-semibold"
                      >
                        + Add Announcement
                      </button>
                    </div>

                    <div className="space-y-2">
                      {announcementConfig.items && announcementConfig.items.map((ann, idx) => (
                        <div key={ann.id || idx} className="p-3 bg-white dark:bg-brand-dark-card border border-primary/5 rounded-xl flex justify-between items-center gap-4 text-xs shadow-sm">
                          <div>
                            <div className="font-semibold text-brand-text dark:text-brand-dark-text">{ann.text.ar} | {ann.text.en}</div>
                            {(ann.startDate || ann.endDate) && (
                              <div className="text-[9px] text-brand-text/45 mt-1 font-english">
                                Schedule: {ann.startDate || "Anytime"} to {ann.endDate || "Anytime"}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAnnItem(idx);
                                setAnnItemForm({
                                  textEn: ann.text.en,
                                  textAr: ann.text.ar,
                                  startDate: ann.startDate || "",
                                  endDate: ann.endDate || ""
                                });
                                setShowAnnModal(true);
                              }}
                              className="px-2.5 py-1 text-primary hover:bg-primary/5 rounded text-[10px] font-bold"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const list = announcementConfig.items.filter((_, i) => i !== idx);
                                setAnnouncementConfig(prev => ({ ...prev, items: list }));
                              }}
                              className="px-2.5 py-1 text-red-500 hover:bg-red-500/5 rounded text-[10px] font-bold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveAnnConfig}
                    className="px-5 py-2 rounded-xl bg-primary text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Save Announcement Bar Settings
                  </button>
                </div>
              </div>

              {/* Why LELA Editor Section */}
              <div className="pt-6 border-t border-primary/5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">
                    Edit "Why LELA" Cards Section
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingWhyCard(null);
                      setWhyCardForm({ id: "", icon: "Sparkles", titleEn: "", titleAr: "", descEn: "", descAr: "", order: whyLelaList.length + 1 });
                      setShowWhyCardModal(true);
                    }}
                    className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-semibold cursor-pointer"
                  >
                    + Add New Card
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {whyLelaList.map((card) => (
                    <div key={card.id} className="p-4 bg-white dark:bg-brand-dark-card border border-primary/5 rounded-2xl flex items-start gap-3 shadow-sm relative group">
                      <div className="p-2.5 bg-primary/5 rounded-xl text-primary mt-1">
                        {card.icon === "Sparkles" && <Sparkles className="w-5 h-5" />}
                        {card.icon === "ShieldCheck" && <ShieldCheck className="w-5 h-5" />}
                        {card.icon === "Coins" && <Coins className="w-5 h-5" />}
                        {card.icon === "Truck" && <Truck className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-brand-text dark:text-brand-dark-text">{card.title.ar} | {card.title.en}</h4>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/5 font-english">Order: {card.order || 1}</span>
                        </div>
                        <p className="text-[10px] text-brand-text/50 dark:text-brand-dark-text/50 font-light leading-relaxed">
                          {card.description.ar}
                        </p>
                        <p className="text-[10px] text-brand-text/50 dark:text-brand-dark-text/50 font-light leading-relaxed">
                          {card.description.en}
                        </p>
                        <div className="flex gap-2 pt-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWhyCard(card);
                              setWhyCardForm({
                                id: card.id,
                                icon: card.icon || "Sparkles",
                                titleEn: card.title.en,
                                titleAr: card.title.ar,
                                descEn: card.description.en,
                                descAr: card.description.ar,
                                order: card.order || 1
                              });
                              setShowWhyCardModal(true);
                            }}
                            className="px-2.5 py-1 text-primary hover:bg-primary/5 rounded text-[10px] font-bold cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteWhyLelaCard(card.id)}
                            className="px-2.5 py-1 text-red-500 hover:bg-red-500/5 rounded text-[10px] font-bold cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* How It Works Editor Section */}
              <div className="pt-6 border-t border-primary/5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">
                    Edit "How It Works" Steps
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingHowStep(null);
                      setHowStepForm({ step: howItWorksList.length + 1, titleEn: "", titleAr: "", descEn: "", descAr: "" });
                      setShowHowStepModal(true);
                    }}
                    className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-semibold cursor-pointer"
                  >
                    + Add New Step
                  </button>
                </div>

                <div className="space-y-3">
                  {howItWorksList.map((item) => (
                    <div key={item.step} className="p-4 bg-white dark:bg-brand-dark-card border border-primary/5 rounded-2xl flex items-center justify-between gap-4 shadow-sm text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary font-english text-xs">
                          0{item.step}
                        </div>
                        <div>
                          <h4 className="font-bold text-brand-text dark:text-brand-dark-text">{item.title.ar} | {item.title.en}</h4>
                          <p className="text-[10px] text-brand-text/50 mt-0.5 line-clamp-1">{item.description.ar} / {item.description.en}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingHowStep(item);
                            setHowStepForm({
                              step: item.step,
                              titleEn: item.title.en,
                              titleAr: item.title.ar,
                              descEn: item.description.en,
                              descAr: item.description.ar
                            });
                            setShowHowStepModal(true);
                          }}
                          className="px-2.5 py-1 text-primary hover:bg-primary/5 rounded text-[10px] font-bold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHowItWorksStep(item.step)}
                          className="px-2.5 py-1 text-red-500 hover:bg-red-500/5 rounded text-[10px] font-bold cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Maintenance options */}
              <div className="pt-6 border-t border-primary/5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">
                  Concierge Security & Maintenance
                </h3>
                <div className="p-5 rounded-2xl border border-yellow-500/10 bg-yellow-500/5 flex items-center justify-between text-xs transition-colors duration-500">
                  <div className="space-y-1">
                    <h4 className="font-bold text-yellow-600 dark:text-yellow-400">Concierge Maintenance Mode</h4>
                    <p className="text-[10px] text-brand-text/50 dark:text-brand-dark-text/50 max-w-md">When active, LELA storefront is closed to customers with an elegant notice. Admin is still accessible.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={maintenanceMode}
                      onChange={(e) => handleToggleMaintenanceMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* SEO Form */}
              <div className="pt-6 border-t border-primary/5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">
                  Concierge Search Engine Optimization (SEO)
                </h3>
                <form onSubmit={handleSeoSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-text/60">SEO Page Title</label>
                      <input
                        type="text"
                        value={seoForm.title}
                        onChange={(e) => setSeoForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-primary/10 bg-admin-bg text-admin-text text-xs"
                        placeholder="e.g. LELA | Luxury Sourcing Concierge"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-text/60">SEO Keywords (comma separated)</label>
                      <input
                        type="text"
                        value={seoForm.keywords}
                        onChange={(e) => setSeoForm(prev => ({ ...prev, keywords: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-primary/10 bg-admin-bg text-admin-text text-xs"
                        placeholder="e.g. fashion, Egypt, shipping, Yemen"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <label className="text-[10px] font-bold text-brand-text/60">SEO Meta Description</label>
                    <textarea
                      rows="2"
                      value={seoForm.description}
                      onChange={(e) => setSeoForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-primary/10 bg-admin-bg text-admin-text text-xs resize-none"
                      placeholder="Concierge description..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold uppercase tracking-wider font-english hover:bg-primary/95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Save SEO Configuration
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 6: FAQ CRUD LIST */}
          {activeTab === "faq" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">
                  Manage FAQ Catalog
                </h3>
                <button
                  onClick={handleOpenAddFaq}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold uppercase tracking-wider font-english hover:bg-primary/95 flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  {t("addFaq")}
                </button>
              </div>

              <div className="space-y-4">
                {(settings?.faq || []).map(f => (
                  <div key={f.id} className="p-4 rounded-xl border border-primary/5 bg-brand-bg/10 flex justify-between items-center gap-4">
                    <div>
                      <h4 className="font-semibold text-xs text-brand-text">{f.question.en}</h4>
                      <p className="text-[10px] text-brand-text/60 italic mt-1 line-clamp-1">{f.answer.en}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenEditFaq(f)} className="p-1.5 rounded-lg hover:bg-primary/5 text-primary">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteFaq(f.id)} className="p-1.5 rounded-lg hover:bg-red-500/5 text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: REVIEWS CRUD LIST */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">
                  Manage Customer Testimonials
                </h3>
                <button
                  onClick={handleOpenAddReview}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold uppercase tracking-wider font-english hover:bg-primary/95 flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  {t("addReview")}
                </button>
              </div>

              <div className="space-y-4">
                {(settings?.reviews || []).map(r => (
                  <div key={r.id} className="p-4 rounded-xl border border-primary/5 bg-brand-bg/10 flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <img src={r.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <h4 className="font-semibold text-xs text-brand-text">{r.name}</h4>
                        <p className="text-[10px] text-brand-text/50 font-english">{r.date} - Rating: {r.rating} stars</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenEditReview(r)} className="p-1.5 rounded-lg hover:bg-primary/5 text-primary">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteReview(r.id)} className="p-1.5 rounded-lg hover:bg-red-500/5 text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: TREASURY / CASHBOX */}
          {activeTab === "treasury" && (
            <ErpTreasury 
              treasuryTransactions={treasuryTransactions} 
              loadData={loadData} 
              settings={settings}
              language={language} 
            />
          )}

          {/* TAB: REPRESENTATIVES */}
          {activeTab === "representatives" && (
            <ErpRepresentatives 
              representatives={representatives} 
              orders={orders} 
              loadData={loadData} 
              language={language} 
            />
          )}

          {/* TAB: WHOLESALERS & INVOICES */}
          {activeTab === "wholesalers" && (
            <ErpWholesalers 
              wholesalers={wholesalers} 
              products={products} 
              loadData={loadData} 
              language={language} 
            />
          )}

          {/* TAB: USER ROLES MANAGER */}
          {activeTab === "user_roles" && (
            <div className="space-y-6 text-xs text-brand-text">
              <div className="flex justify-between items-center border-b border-primary/5 pb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">User Role Permissions Manager</h3>
                  <p className="text-[10px] text-brand-text/50 mt-1">Configure role-based views for store dashboard log-ins</p>
                </div>
              </div>
              <div className="overflow-x-auto bg-brand-card dark:bg-brand-dark-card border border-primary/5 rounded-2xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-primary/5 bg-brand-bg/25 text-brand-text/50 font-bold uppercase tracking-wider text-[9px]">
                      <th className="p-3">User Email</th>
                      <th className="p-3">User ID</th>
                      <th className="p-3">Assigned Role</th>
                      <th className="p-3 text-center">Save</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map(p => (
                      <tr key={p.id} className="border-b border-primary/5 hover:bg-brand-bg/5 transition-colors">
                        <td className="p-3 font-semibold text-primary">{p.email}</td>
                        <td className="p-3 font-english text-brand-text/50">{p.id}</td>
                        <td className="p-3">
                          <select
                            defaultValue={p.role}
                            onChange={async (e) => {
                              try {
                                await erpService.saveProfileRole(p.id, e.target.value);
                                toast.success("Role updated successfully!");
                                loadData();
                              } catch (err) {
                                toast.error("Failed to update role.");
                              }
                            }}
                            className="px-2 py-1 rounded border border-primary/15 bg-brand-bg font-medium"
                          >
                            <option value="owner">Owner</option>
                            <option value="manager">Manager</option>
                            <option value="warehouse">Warehouse</option>
                            <option value="accountant">Accountant</option>
                            <option value="sales">Sales Representative</option>
                            <option value="support">Customer Support</option>
                          </select>
                        </td>
                        <td className="p-3 text-center font-bold text-green-500 font-english">Auto-saved</td>
                      </tr>
                    ))}
                    {profiles.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-8 text-brand-text/40 italic">
                          No logged user profiles registered. Ensure other emails sign up through the login panel.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          </>
          )}
        </main>
      </div>

      {/* PRODUCT MODAL CONTAINER */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-brand-dark-card border border-primary/10 rounded-3xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-primary/5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary dark:text-secondary">
                {editingProduct ? t("editProduct") : t("addProduct")}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-brand-text/50 hover:text-brand-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Modal Form content */}
            <form onSubmit={handleProductSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">{t("productNameEn")}</label>
                  <input
                    type="text"
                    required
                    value={productForm.nameEn}
                    onChange={(e) => setProductForm(prev => ({ ...prev, nameEn: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">{t("productNameAr")}</label>
                  <input
                    type="text"
                    required
                    value={productForm.nameAr}
                    onChange={(e) => setProductForm(prev => ({ ...prev, nameAr: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">{t("productDescEn")}</label>
                  <textarea
                    rows="3"
                    required
                    value={productForm.descEn}
                    onChange={(e) => setProductForm(prev => ({ ...prev, descEn: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">{t("productDescAr")}</label>
                  <textarea
                    rows="3"
                    required
                    value={productForm.descAr}
                    onChange={(e) => setProductForm(prev => ({ ...prev, descAr: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs resize-none text-right"
                  />
                </div>
              </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-brand-text/60">Category</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs bg-admin-bg text-admin-text font-medium"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name.en}>
                          {c.name.en}
                        </option>
                      ))}
                      {categories.length === 0 && (
                        <>
                          <option value="Personal Care">Personal Care</option>
                          <option value="Clothing">Clothing</option>
                          <option value="Home Products">Home Products</option>
                          <option value="Accessories">Accessories</option>
                          <option value="Kids">Kids</option>
                          <option value="Electronics">Electronics</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-brand-text/60">Purchase Cost (EGP)</label>
                    <input
                      type="number"
                      required
                      value={productForm.purchaseCost}
                      placeholder="e.g. 800"
                      onChange={(e) => setProductForm(prev => ({ ...prev, purchaseCost: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs font-english bg-admin-bg text-admin-text"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-brand-text/60">Packaging Cost (EGP)</label>
                    <input
                      type="number"
                      required
                      value={productForm.packagingCost}
                      placeholder="e.g. 50"
                      onChange={(e) => setProductForm(prev => ({ ...prev, packagingCost: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs font-english bg-admin-bg text-admin-text"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-brand-text/60">Cairo Profit Margin (EGP)</label>
                    <input
                      type="number"
                      required
                      value={productForm.profitEGP}
                      placeholder="e.g. 300"
                      onChange={(e) => setProductForm(prev => ({ ...prev, profitEGP: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs font-english bg-admin-bg text-admin-text"
                    />
                  </div>
                </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">Weight (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.weight}
                    onChange={(e) => setProductForm(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs font-english bg-admin-bg text-admin-text"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">Stock Qty</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs font-english bg-admin-bg text-admin-text"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">Visibility Status</label>
                  <select
                    value={productForm.status}
                    onChange={(e) => setProductForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs bg-admin-bg text-admin-text"
                  >
                    <option value="visible">Visible</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
                <div className="space-y-1 pt-6 flex items-center justify-center">
                  <label className="flex items-center gap-2 text-xs font-semibold text-brand-text dark:text-brand-dark-text cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.featured}
                      onChange={(e) => setProductForm(prev => ({ ...prev, featured: e.target.checked }))}
                      className="rounded border-primary/10 text-primary w-4 h-4"
                    />
                    Featured
                  </label>
                </div>
              </div>

              {/* Real-time Smart Pricing Calculator Panel */}
              {(() => {
                const purchaseCost = parseFloat(productForm.purchaseCost || 0);
                const packagingCost = parseFloat(productForm.packagingCost || 0);
                const profit = parseFloat(productForm.profitEGP || 0);
                const weight = parseFloat(productForm.weight || 0.5);
                
                const ratePerKg = productForm.category === "Personal Care"
                  ? (settings?.shippingRates?.personalCare || 450)
                  : (settings?.shippingRates?.clothingHome || 300);
                const shipCostEGP = ratePerKg * weight;
                
                const totalCostEGP = purchaseCost + shipCostEGP + packagingCost;
                const sellingPriceEGP = totalCostEGP + profit;
                const grossProfitEGP = sellingPriceEGP - purchaseCost;
                const netProfitEGP = sellingPriceEGP - totalCostEGP;
                const profitMarginPercent = sellingPriceEGP > 0 ? (netProfitEGP / sellingPriceEGP) * 100 : 0;

                const egpToYer = settings?.currency?.egpToYerRate || 11.5;
                const yerToSar = settings?.currency?.yerToSarRate || 140;
                const priceYER = Math.round(sellingPriceEGP * egpToYer);
                const priceSAR = Math.round(priceYER / yerToSar);
                
                return (
                  <div className="p-4 rounded-2xl bg-primary/5 dark:bg-brand-dark-bg/40 border border-primary/10 dark:border-secondary/15 space-y-3 text-xs">
                    <h4 className="text-[10px] font-bold uppercase text-primary dark:text-secondary tracking-wider">
                      Real-Time Smart ERP Costing & Pricing Calculator
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-light text-[10px] border-b border-primary/5 pb-2">
                      <div>
                        <span className="text-brand-text/50 block">Purchase Cost:</span>
                        <span className="font-bold font-english text-brand-text dark:text-brand-dark-text">{purchaseCost.toLocaleString()} EGP</span>
                      </div>
                      <div>
                        <span className="text-brand-text/50 block">Est. Sourcing Shipping:</span>
                        <span className="font-bold font-english text-brand-text dark:text-brand-dark-text">{Math.round(shipCostEGP).toLocaleString()} EGP</span>
                      </div>
                      <div>
                        <span className="text-brand-text/50 block">Packaging Cost:</span>
                        <span className="font-bold font-english text-brand-text dark:text-brand-dark-text">{packagingCost.toLocaleString()} EGP</span>
                      </div>
                      <div>
                        <span className="text-brand-text/50 block">Total Unit Cost:</span>
                        <span className="font-extrabold font-english text-primary dark:text-secondary">{totalCostEGP.toLocaleString()} EGP</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-light text-[10px]">
                      <div>
                        <span className="text-brand-text/50 block">Selling Price (Customer):</span>
                        <span className="font-extrabold font-english text-primary dark:text-secondary">{sellingPriceEGP.toLocaleString()} EGP</span>
                      </div>
                      <div>
                        <span className="text-brand-text/50 block">Gross Profit / Net Profit:</span>
                        <span className="font-bold font-english text-green-500">{grossProfitEGP.toLocaleString()} EGP / {netProfitEGP.toLocaleString()} EGP</span>
                      </div>
                      <div>
                        <span className="text-brand-text/50 block">Profit Margin:</span>
                        <span className="font-bold font-english text-green-500">{profitMarginPercent.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-brand-text/50 block">Yemen Conversions:</span>
                        <span className="font-bold font-english text-brand-text dark:text-brand-dark-text">{priceYER.toLocaleString()} YER / {priceSAR.toLocaleString()} SAR</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Multiple Images Upload & Gallery */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-brand-text/60">Product Images</label>
                
                {/* Visual Image Grid for deletion / reordering / choosing cover */}
                {getImagesList().length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pb-2">
                    {getImagesList().map((url, idx) => (
                      <div key={idx} className="relative group/img aspect-square rounded-xl overflow-hidden border border-primary/10 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute bottom-1 inset-x-1 bg-primary/95 text-white text-[8px] font-bold text-center py-0.5 rounded uppercase tracking-wider">
                            Cover
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col justify-between p-1.5 z-10">
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(idx)}
                            className="self-end text-red-400 hover:text-red-500 p-0.5 bg-white/10 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex justify-between items-center gap-1">
                            <div className="flex gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleReorderImage(idx, "up")}
                                className="text-white hover:text-primary p-0.5 bg-white/10 rounded disabled:opacity-30 cursor-pointer"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                disabled={idx === getImagesList().length - 1}
                                onClick={() => handleReorderImage(idx, "down")}
                                className="text-white hover:text-primary p-0.5 bg-white/10 rounded disabled:opacity-30 cursor-pointer"
                              >
                                ↓
                              </button>
                            </div>
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleSetCoverImage(idx)}
                                className="text-[7.5px] text-white bg-primary px-1 py-0.5 rounded font-bold uppercase tracking-wider cursor-pointer"
                              >
                                Cover
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Drag and Drop/Click Area for uploads */}
                <label htmlFor="product-images-upload" className="border-2 border-dashed border-primary/10 dark:border-secondary/15 rounded-2xl p-4 flex flex-col items-center justify-center bg-brand-bg/25 dark:bg-brand-dark-bg/25 text-center hover:bg-brand-bg/40 transition-colors cursor-pointer relative">
                  <Upload className="w-6 h-6 text-primary/40 dark:text-secondary/40 mb-1" />
                  <span className="text-[10px] text-brand-text/60 dark:text-brand-dark-text/60 font-semibold">
                    Click to Upload Images (Supabase Storage)
                  </span>
                </label>
                <input
                  id="product-images-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <textarea
                  rows="2"
                  placeholder="Paste additional image URLs (one URL per line)"
                  value={productForm.imagesText}
                  onChange={(e) => setProductForm(prev => ({ ...prev, imagesText: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 text-xs font-english bg-admin-bg text-admin-text dark:text-white"
                />
              </div>

              {/* Discount settings row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">Discount Type</label>
                  <select
                    value={productForm.discountType}
                    onChange={(e) => setProductForm(prev => ({ ...prev, discountType: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs bg-admin-bg text-admin-text dark:text-white dark:border-secondary/10"
                  >
                    <option value="none">No Discount</option>
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed">Fixed Discount (YER)</option>
                  </select>
                </div>
                {productForm.discountType !== "none" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-brand-text/60">
                      {productForm.discountType === "percentage" ? "Discount Percentage (%)" : "Fixed Discount Value (YER)"}
                    </label>
                    <input
                      type="number"
                      value={productForm.discountValue}
                      onChange={(e) => setProductForm(prev => ({ ...prev, discountValue: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs bg-admin-bg text-admin-text dark:text-white dark:border-secondary/10"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">Sizes (comma separated)</label>
                  <input
                    type="text"
                    placeholder={t("sizesPlaceholder")}
                    value={productForm.sizesText}
                    onChange={(e) => setProductForm(prev => ({ ...prev, sizesText: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs font-english bg-admin-bg text-admin-text dark:text-white dark:border-secondary/10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">Colors (comma separated)</label>
                  <input
                    type="text"
                    placeholder={t("colorsPlaceholder")}
                    value={productForm.colorsText}
                    onChange={(e) => setProductForm(prev => ({ ...prev, colorsText: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs font-english bg-admin-bg text-admin-text dark:text-white dark:border-secondary/10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. new, featured, zara"
                    value={productForm.tagsText}
                    onChange={(e) => setProductForm(prev => ({ ...prev, tagsText: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs font-english bg-admin-bg text-admin-text dark:text-white dark:border-secondary/10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-brand-text/60">
                  Custom Options & Variants (e.g. Storage: 128GB, 256GB | Capacity: 100ml, 200ml)
                </label>
                <input
                  type="text"
                  placeholder="Format - OptionName: Val1, Val2 | Option2: Val3, Val4"
                  value={productForm.variantsText}
                  onChange={(e) => setProductForm(prev => ({ ...prev, variantsText: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs font-english bg-admin-bg text-admin-text dark:text-white dark:border-secondary/10"
                />
              </div>

              <div className="pt-4 border-t border-primary/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-5 py-2.5 rounded-xl border text-xs font-semibold font-english uppercase tracking-wider text-brand-text/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold font-english uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-primary/15"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAQ MODAL CONTAINER */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-brand-dark-card border border-primary/10 rounded-3xl shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-primary/5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                {editingFaq ? "Edit FAQ" : "Add FAQ"}
              </h3>
              <button onClick={() => setShowFaqModal(false)} className="text-brand-text/50">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleFaqSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-brand-text/60">{t("questionEn")}</label>
                <input
                  type="text"
                  required
                  value={faqForm.qEn}
                  onChange={(e) => setFaqForm(prev => ({ ...prev, qEn: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-brand-text/60">{t("questionAr")}</label>
                <input
                  type="text"
                  required
                  value={faqForm.qAr}
                  onChange={(e) => setFaqForm(prev => ({ ...prev, qAr: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs text-right"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-brand-text/60">{t("answerEn")}</label>
                <textarea
                  rows="3"
                  required
                  value={faqForm.aEn}
                  onChange={(e) => setFaqForm(prev => ({ ...prev, aEn: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-brand-text/60">{t("answerAr")}</label>
                <textarea
                  rows="3"
                  required
                  value={faqForm.aAr}
                  onChange={(e) => setFaqForm(prev => ({ ...prev, aAr: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs resize-none text-right"
                />
              </div>
              <div className="pt-4 border-t border-primary/5 flex justify-end gap-3">
                <button type="button" onClick={() => setShowFaqModal(false)} className="px-5 py-2.5 rounded-xl border text-xs font-semibold uppercase font-english">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold uppercase font-english flex items-center gap-1.5 shadow-md">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW MODAL CONTAINER */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-brand-dark-card border border-primary/10 rounded-3xl shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-primary/5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                {editingReview ? "Edit Review" : "Add Review"}
              </h3>
              <button onClick={() => setShowReviewModal(false)} className="text-brand-text/50">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">{t("reviewerName")}</label>
                  <input
                    type="text"
                    required
                    value={reviewForm.name}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">{t("rating")}</label>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, rating: e.target.value }))}
                    className="w-full px-2 py-2 rounded-xl border border-primary/10 text-xs"
                  >
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">{t("date")}</label>
                  <input
                    type="date"
                    required
                    value={reviewForm.date}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs font-english"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">{t("avatarUrl")}</label>
                  <input
                    type="text"
                    value={reviewForm.avatar}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, avatar: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs font-english"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-brand-text/60">{t("reviewTextEn")}</label>
                <textarea
                  rows="2"
                  required
                  value={reviewForm.commentEn}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, commentEn: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-brand-text/60">{t("reviewTextAr")}</label>
                <textarea
                  rows="2"
                  required
                  value={reviewForm.commentAr}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, commentAr: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs resize-none text-right"
                />
              </div>
              <div className="pt-4 border-t border-primary/5 flex justify-end gap-3">
                <button type="button" onClick={() => setShowReviewModal(false)} className="px-5 py-2.5 rounded-xl border text-xs font-semibold uppercase font-english">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold uppercase font-english flex items-center gap-1.5 shadow-md">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CATEGORY MODAL CONTAINER */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-brand-dark-card border border-primary/10 rounded-3xl flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-primary/5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary dark:text-secondary">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-brand-text/50 hover:text-brand-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-brand-text/60">Category Name (English)</label>
                <input
                  type="text"
                  required
                  value={categoryForm.nameEn}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, nameEn: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs text-brand-text dark:text-brand-dark-text bg-transparent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-brand-text/60">Category Name (Arabic)</label>
                <input
                  type="text"
                  required
                  value={categoryForm.nameAr}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, nameAr: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs text-right text-brand-text dark:text-brand-dark-text bg-transparent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-brand-text/60">Image URL</label>
                <input
                  type="text"
                  required
                  value={categoryForm.image}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, image: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs text-brand-text dark:text-brand-dark-text bg-transparent font-english"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">Display Order</label>
                  <input
                    type="number"
                    required
                    value={categoryForm.order}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, order: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs text-brand-text dark:text-brand-dark-text bg-transparent font-english"
                  />
                </div>
                <div className="flex items-center justify-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-brand-text dark:text-brand-dark-text cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categoryForm.hidden}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, hidden: e.target.checked }))}
                      className="rounded border-primary/10 text-primary w-4 h-4"
                    />
                    Hide Category
                  </label>
                </div>
              </div>
              <div className="pt-4 border-t border-primary/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold uppercase tracking-wider text-brand-text/75"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-primary/15"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COUPON MODAL CONTAINER */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-brand-dark-card border border-primary/10 rounded-3xl flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-primary/5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary dark:text-secondary">
                {editingCoupon ? "Edit Discount Coupon" : "Add Discount Coupon"}
              </h3>
              <button onClick={() => setShowCouponModal(false)} className="text-brand-text/50 hover:text-brand-text cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCouponSubmit} className="p-6 space-y-4 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-brand-text/60">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LELA10"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs text-brand-text dark:text-brand-dark-text bg-transparent font-english uppercase focus:outline-none dark:border-secondary/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">Discount Type</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, discountType: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs text-brand-text dark:text-brand-dark-text bg-transparent focus:outline-none dark:border-secondary/10"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Value (YER)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">
                    {couponForm.discountType === "percentage" ? "Discount Percentage (%)" : "Fixed Discount Value (YER)"}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder={couponForm.discountType === "percentage" ? "10" : "5000"}
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, discountValue: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs text-brand-text dark:text-brand-dark-text bg-transparent font-english focus:outline-none dark:border-secondary/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">Min Order Value (YER)</label>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={couponForm.minOrderValue}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, minOrderValue: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs text-brand-text dark:text-brand-dark-text bg-transparent font-english focus:outline-none dark:border-secondary/10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-text/60">Max Uses Limit</label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={couponForm.maxUses}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, maxUses: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs text-brand-text dark:text-brand-dark-text bg-transparent font-english focus:outline-none dark:border-secondary/10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-brand-text/60">Expiration Date</label>
                <input
                  type="date"
                  value={couponForm.expirationDate}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, expirationDate: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 text-xs text-brand-text dark:text-brand-dark-text bg-transparent font-english focus:outline-none dark:border-secondary/10"
                />
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-brand-text dark:text-brand-dark-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={couponForm.active}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, active: e.target.checked }))}
                    className="rounded border-primary/10 text-primary w-4 h-4"
                  />
                  Active & Redeemable
                </label>
              </div>
              <div className="pt-4 border-t border-primary/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold uppercase tracking-wider text-brand-text/75"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-primary/15"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Item modal */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-dark-card border border-primary/10 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold uppercase text-brand-text dark:text-brand-dark-text">
              {editingAnnItem !== null ? "Edit Announcement Notice" : "Add Announcement Notice"}
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-text/50">Notice Text (Arabic)</label>
                <input
                  type="text"
                  value={annItemForm.textAr}
                  onChange={(e) => setAnnItemForm(prev => ({ ...prev, textAr: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-primary/10 bg-admin-bg text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-text/50">Notice Text (English)</label>
                <input
                  type="text"
                  value={annItemForm.textEn}
                  onChange={(e) => setAnnItemForm(prev => ({ ...prev, textEn: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-primary/10 bg-admin-bg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-text/50">Start Date</label>
                  <input
                    type="date"
                    value={annItemForm.startDate}
                    onChange={(e) => setAnnItemForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-primary/10 bg-admin-bg text-xs font-english"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-text/50">End Date</label>
                  <input
                    type="date"
                    value={annItemForm.endDate}
                    onChange={(e) => setAnnItemForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-primary/10 bg-admin-bg text-xs font-english"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAnnModal(false)}
                className="px-3 py-1.5 border border-primary/10 rounded-lg text-[10px] font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = {
                    id: editingAnnItem !== null && announcementConfig.items[editingAnnItem]?.id ? announcementConfig.items[editingAnnItem].id : String(Date.now()),
                    text: { en: annItemForm.textEn, ar: annItemForm.textAr },
                    startDate: annItemForm.startDate,
                    endDate: annItemForm.endDate
                  };
                  const updatedItems = [...(announcementConfig.items || [])];
                  if (editingAnnItem !== null) {
                    updatedItems[editingAnnItem] = item;
                  } else {
                    updatedItems.push(item);
                  }
                  setAnnouncementConfig(prev => ({ ...prev, items: updatedItems }));
                  setShowAnnModal(false);
                }}
                className="px-4 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Why LELA Card Modal */}
      {showWhyCardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-dark-card border border-primary/10 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold uppercase text-brand-text dark:text-brand-dark-text">
              {editingWhyCard ? "Edit Why LELA Card" : "Add Why LELA Card"}
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await handleSaveWhyLelaCard({
                id: whyCardForm.id,
                icon: whyCardForm.icon,
                title: { en: whyCardForm.titleEn, ar: whyCardForm.titleAr },
                description: { en: whyCardForm.descEn, ar: whyCardForm.descAr },
                order: parseInt(whyCardForm.order || 1, 10)
              });
              setShowWhyCardModal(false);
            }} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-text/50">Icon</label>
                <select
                  value={whyCardForm.icon}
                  onChange={(e) => setWhyCardForm(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-primary/10 bg-admin-bg text-xs focus:outline-none"
                >
                  <option value="Sparkles">Sparkles</option>
                  <option value="ShieldCheck">ShieldCheck</option>
                  <option value="Coins">Coins</option>
                  <option value="Truck">Truck</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-text/50">Title (Arabic)</label>
                  <input
                    type="text"
                    required
                    value={whyCardForm.titleAr}
                    onChange={(e) => setWhyCardForm(prev => ({ ...prev, titleAr: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-primary/10 bg-admin-bg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-text/50">Title (English)</label>
                  <input
                    type="text"
                    required
                    value={whyCardForm.titleEn}
                    onChange={(e) => setWhyCardForm(prev => ({ ...prev, titleEn: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-primary/10 bg-admin-bg text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-text/50">Description (Arabic)</label>
                <textarea
                  required
                  rows="2"
                  value={whyCardForm.descAr}
                  onChange={(e) => setWhyCardForm(prev => ({ ...prev, descAr: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-primary/10 bg-admin-bg text-xs resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-text/50">Description (English)</label>
                <textarea
                  required
                  rows="2"
                  value={whyCardForm.descEn}
                  onChange={(e) => setWhyCardForm(prev => ({ ...prev, descEn: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-primary/10 bg-admin-bg text-xs resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-text/50">Display Order</label>
                <input
                  type="number"
                  value={whyCardForm.order}
                  onChange={(e) => setWhyCardForm(prev => ({ ...prev, order: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-primary/10 bg-admin-bg text-xs font-english"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowWhyCardModal(false)}
                  className="px-3 py-1.5 border border-primary/10 rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* How It Works Step Modal */}
      {showHowStepModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-dark-card border border-primary/10 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold uppercase text-brand-text dark:text-brand-dark-text">
              {editingHowStep ? "Edit How It Works Step" : "Add How It Works Step"}
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await handleSaveHowItWorksStep({
                step: parseInt(howStepForm.step || 1, 10),
                title: { en: howStepForm.titleEn, ar: howStepForm.titleAr },
                description: { en: howStepForm.descEn, ar: howStepForm.descAr }
              });
              setShowHowStepModal(false);
            }} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-text/50">Step Number</label>
                <input
                  type="number"
                  required
                  value={howStepForm.step}
                  onChange={(e) => setHowStepForm(prev => ({ ...prev, step: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-primary/10 bg-admin-bg text-xs font-english"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-text/50">Title (Arabic)</label>
                  <input
                    type="text"
                    required
                    value={howStepForm.titleAr}
                    onChange={(e) => setHowStepForm(prev => ({ ...prev, titleAr: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-primary/10 bg-admin-bg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-text/50">Title (English)</label>
                  <input
                    type="text"
                    required
                    value={howStepForm.titleEn}
                    onChange={(e) => setHowStepForm(prev => ({ ...prev, titleEn: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-primary/10 bg-admin-bg text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-text/50">Description (Arabic)</label>
                <textarea
                  required
                  rows="2"
                  value={howStepForm.descAr}
                  onChange={(e) => setHowStepForm(prev => ({ ...prev, descAr: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-primary/10 bg-admin-bg text-xs resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-text/50">Description (English)</label>
                <textarea
                  required
                  rows="2"
                  value={howStepForm.descEn}
                  onChange={(e) => setHowStepForm(prev => ({ ...prev, descEn: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-primary/10 bg-admin-bg text-xs resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowHowStepModal(false)}
                  className="px-3 py-1.5 border border-primary/10 rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  Save Step
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
