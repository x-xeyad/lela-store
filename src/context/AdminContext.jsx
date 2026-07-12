import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription = null;
    
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
          setUser(session.user);
        } else {
          setIsAuthenticated(false);
        }
        
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          setIsAuthenticated(!!session);
          setUser(session?.user || null);
        });
        subscription = data?.subscription;
      } catch (e) {
        console.error("Auth check failed:", e);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkUser();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    setIsAuthenticated(true);
    setUser(data.user);
    return true;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Signout error:", e);
    }
    setIsAuthenticated(false);
    setUser(null);
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
