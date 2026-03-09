import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const tokenCheckInterval = useRef(null);

  const getDefaultModule = useCallback((role) => {
    if (!role) return null;
    const r = role.toLowerCase();
    if (r === "admin" || r === "user") return "billing";
    return "billing";
  }, []);

  const isTokenExpired = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true; 
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setModule(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    if (tokenCheckInterval.current) {
      clearInterval(tokenCheckInterval.current);
      tokenCheckInterval.current = null;
    }
  }, []);

  const startTokenCheck = useCallback(() => {

    if (tokenCheckInterval.current) {
      clearInterval(tokenCheckInterval.current);
    }

    tokenCheckInterval.current = setInterval(() => {
      const token = localStorage.getItem("accessToken");

      if (!token || isTokenExpired(token)) {
        console.log("Token expired — logging out automatically");
        logout();

        window.location.href = "/login";
      }
    }, 60 * 1000);
  }, [logout]);

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setLoading(false);
        return;
      }

      if (isTokenExpired(token)) {
        logout();
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:4000/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setModule(getDefaultModule(data.user.role));
          startTokenCheck(); 
        } else {
          logout();
        }
      } catch (err) {
        console.error("Auth verification failed:", err);
      } finally {
        setLoading(false);
      }
    };

    verifySession();

    return () => {
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
      }
    };
  }, [getDefaultModule, logout, startTokenCheck]);

  const login = (userData, accessToken) => {
    setUser(userData);
    setModule(getDefaultModule(userData.role));
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("user", JSON.stringify(userData));
    startTokenCheck(); 
  };

  const selectModule = (mod) => setModule(mod);

  const hasModuleAccess = (requiredModule) => {
    if (!requiredModule) return true;
    return module === requiredModule;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, module, selectModule, hasModuleAccess, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
