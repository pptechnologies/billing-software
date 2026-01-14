import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [module, setModule] = useState(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);

      setModule(getDefaultModule(storedUser.role));
    }
    setLoading(false);
  }, []);

  const getDefaultModule = (role) => {
    if (!role) return null;
    const r = role.toLowerCase();
    if (r === "billing") return "billing";
    if (r === "hr") return "hrms";
    if (r === "employee") return "emp";
    return null; 
  };

  const login = (userData) => {
    setUser(userData);
    setModule(getDefaultModule(userData.role)); 
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setModule(null);
    localStorage.removeItem("user");
  };

  const selectModule = (mod) => {
    setModule(mod); 
  };

  const hasModuleAccess = (requiredModule) => {
    if (!requiredModule) return true; 
    return module === requiredModule;
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, module, selectModule, hasModuleAccess, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
