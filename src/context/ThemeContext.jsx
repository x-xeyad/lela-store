import React, { createContext, useContext, useState, useEffect } from "react";
import { settingsService } from "../services/settingsService";
import logoLight from "../assets/logo_light.png";
import logoDark from "../assets/logo_dark.png";
import { supabase } from "../services/supabaseClient";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("lela_theme");
    if (saved) return saved;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  const [branding, setBranding] = useState(null);
  const [themeSettings, setThemeSettings] = useState(null);

  const loadThemeSettings = async () => {
    try {
      const config = await settingsService.get();
      if (config) {
        setBranding(config.branding);
        setThemeSettings(config.theme);
      }
    } catch (e) {
      console.error("Failed to load theme config:", e);
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
    if (!themeSettings) return;
    const root = document.documentElement;
    
    if (theme === "dark") {
      root.style.setProperty("--primary", themeSettings.darkPrimaryColor || "#8A3D5A");
      root.style.setProperty("--primary-dark", themeSettings.darkPrimaryColor || "#74334B");
      root.style.setProperty("--primary-light", themeSettings.darkAccentColor || "#A35A75");
      root.style.setProperty("--secondary", themeSettings.darkSecondaryColor || "#E3B8AE");
      root.style.setProperty("--background", themeSettings.darkBackgroundColor || "#0F172A");
      root.style.setProperty("--surface", themeSettings.darkCardBg || "#1E293B");
      root.style.setProperty("--text", themeSettings.darkTextColor || "#FFFFFF");
      root.style.setProperty("--text-light", themeSettings.darkTextColor || "#CBD5E1");
      root.style.setProperty("--border", themeSettings.darkBorderColor || "#334155");
    } else {
      root.style.setProperty("--primary", themeSettings.primaryColor || "#8A3D5A");
      root.style.setProperty("--primary-dark", themeSettings.primaryColor || "#74334B");
      root.style.setProperty("--primary-light", themeSettings.accentColor || "#A35A75");
      root.style.setProperty("--secondary", themeSettings.secondaryColor || "#E3B8AE");
      root.style.setProperty("--background", themeSettings.backgroundColor || "#FFF9F7");
      root.style.setProperty("--surface", themeSettings.cardBg || "#FFFFFF");
      root.style.setProperty("--text", themeSettings.textColor || "#3A2A30");
      root.style.setProperty("--text-light", themeSettings.textColor || "#7A6770");
      root.style.setProperty("--border", themeSettings.borderColor || "#E8D5CF");
    }
  }, [theme, themeSettings]);

  // Apply Branding Metadata
  useEffect(() => {
    if (!branding) return;
    if (branding.websiteName) {
      document.title = branding.websiteName;
    }
    if (branding.faviconUrl) {
      let link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement("link");
        link.type = "image/x-icon";
        link.rel = "shortcut icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      link.href = branding.faviconUrl;
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
