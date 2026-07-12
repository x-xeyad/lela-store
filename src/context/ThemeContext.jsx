import React, { createContext, useContext, useState, useEffect } from "react";
import { settingsService } from "../services/settingsService";
import logoLight from "../assets/logo_light.png";
import logoDark from "../assets/logo_dark.png";
import { supabase } from "../services/supabaseClient";

const ThemeContext = createContext();

const defaultBranding = {
  logoUrl: "",
  logoDarkUrl: "",
  faviconUrl: "",
  loadingLogoUrl: "",
  browserIconUrl: "",
  websiteName: "LELA Store",
  primaryColor: "#8A3D5A",
  secondaryColor: "#E3B8AE",
  backgroundColor: "#FFF9F7",
  textColor: "#3A2A30"
};

const defaultTheme = {
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
  darkCardBg: "#1E293B"
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("lela_theme");
    if (saved) return saved;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  const [branding, setBranding] = useState(defaultBranding);
  const [themeSettings, setThemeSettings] = useState(defaultTheme);

  const loadThemeSettings = async () => {
    try {
      const config = await settingsService.get();
      if (config) {
        if (config.branding) setBranding(prev => ({ ...prev, ...config.branding }));
        if (config.theme) setThemeSettings(prev => ({ ...prev, ...config.theme }));
      }
    } catch (e) {
      console.warn("Failed to load theme config, using defaults:", e);
    }
  };

  useEffect(() => {
    loadThemeSettings();

    const settingsSubscription = supabase
      .channel("realtime-settings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settings" },
        () => {
          loadThemeSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsSubscription);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("lela_theme", theme);
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme]);

  // Apply Theme Colors dynamically based on active theme
  useEffect(() => {
    const root = document.documentElement;
    const activeTheme = themeSettings || defaultTheme;
    
    if (theme === "dark") {
      root.style.setProperty("--primary", activeTheme.darkPrimaryColor || "#8A3D5A");
      root.style.setProperty("--primary-dark", activeTheme.darkPrimaryColor || "#74334B");
      root.style.setProperty("--primary-light", activeTheme.darkAccentColor || "#A35A75");
      root.style.setProperty("--secondary", activeTheme.darkSecondaryColor || "#E3B8AE");
      root.style.setProperty("--background", activeTheme.darkBackgroundColor || "#0F172A");
      root.style.setProperty("--surface", activeTheme.darkCardBg || "#1E293B");
      root.style.setProperty("--text", activeTheme.darkTextColor || "#FFFFFF");
      root.style.setProperty("--text-light", activeTheme.darkTextColor || "#CBD5E1");
      root.style.setProperty("--border", activeTheme.darkBorderColor || "#334155");
    } else {
      root.style.setProperty("--primary", activeTheme.primaryColor || "#8A3D5A");
      root.style.setProperty("--primary-dark", activeTheme.primaryColor || "#74334B");
      root.style.setProperty("--primary-light", activeTheme.accentColor || "#A35A75");
      root.style.setProperty("--secondary", activeTheme.secondaryColor || "#E3B8AE");
      root.style.setProperty("--background", activeTheme.backgroundColor || "#FFF9F7");
      root.style.setProperty("--surface", activeTheme.cardBg || "#FFFFFF");
      root.style.setProperty("--text", activeTheme.textColor || "#3A2A30");
      root.style.setProperty("--text-light", activeTheme.textColor || "#7A6770");
      root.style.setProperty("--border", activeTheme.borderColor || "#E8D5CF");
    }
  }, [theme, themeSettings]);

  // Apply Branding Metadata
  useEffect(() => {
    const activeBranding = branding || defaultBranding;
    if (activeBranding.websiteName) {
      document.title = activeBranding.websiteName;
    }
    if (activeBranding.faviconUrl) {
      let link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement("link");
        link.type = "image/x-icon";
        link.rel = "shortcut icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      link.href = activeBranding.faviconUrl;
    }
  }, [branding]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  const resolveLogoUrl = (customUrl, fallbackAsset) => {
    if (!customUrl || customUrl.startsWith("/assets/logo_") || customUrl.includes("logo_light.png") || customUrl.includes("logo_dark.png")) {
      return fallbackAsset;
    }
    return customUrl;
  };

  const activeLogo = theme === "dark"
    ? resolveLogoUrl(branding?.logoDarkUrl, logoDark)
    : resolveLogoUrl(branding?.logoUrl, logoLight);

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      toggleTheme,
      isDark: theme === "dark",
      branding,
      themeSettings,
      activeLogo,
      loadThemeSettings
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
