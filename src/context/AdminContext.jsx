import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../services/supabaseClient";

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription = null;
    
    const checkUser = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setIsAuthenticated(true);
            setUser(session.user);
          } else {
            const localAuth = localStorage.getItem("lela_admin_auth") === "true" || sessionStorage.getItem("lela_admin_auth") === "true";
            setIsAuthenticated(localAuth);
          }
          
          const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);
            setUser(session?.user || null);
          });
          subscription = data?.subscription;
        } catch (e) {
          console.error("Auth check failed:", e);
          const localAuth = localStorage.getItem("lela_admin_auth") === "true" || sessionStorage.getItem("lela_admin_auth") === "true";
          setIsAuthenticated(localAuth);
        }
      } else {
        const localAuth = localStorage.getItem("lela_admin_auth") === "true" || sessionStorage.getItem("lela_admin_auth") === "true";
        setIsAuthenticated(localAuth);
      }
      setLoading(false);
    };

    checkUser();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password, rememberMe = false) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      
      setIsAuthenticated(true);
      setUser(data.user);
      return true;
    } else {
      if (password === "lela2026") {
        setIsAuthenticated(true);
        if (rememberMe) {
          localStorage.setItem("lela_admin_auth", "true");
        } else {
          sessionStorage.setItem("lela_admin_auth", "true");
        }
        return true;
      }
      throw new Error("Incorrect passcode. Try again.");
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Signout error:", e);
      }
    }
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("lela_admin_auth");
    sessionStorage.removeItem("lela_admin_auth");
  };

  return (
    <AdminContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used within an AdminProvider");
  return context;
};
