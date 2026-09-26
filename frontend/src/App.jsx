import { useState } from "react";
import Home from "./Home";
import Auth from "./Auth";
import Admin from "./Admin";
import AdminLogin from "./AdminLogin";

function App() {
  const isAdminPage = window.location.pathname === "/admin";
  
  const [showAuth, setShowAuth] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const handleCustomerLogin = () => {
    setShowAuth(false);
  };

  const handleAdminLogin = () => {
    setShowAdminLogin(false);
    setShowAdmin(true);
  };

  if (isAdminPage && !showAdminLogin && !showAdmin) {
  return (
    <AdminLogin
      onLogin={handleAdminLogin}
      onBack={() => {
        window.location.href = "/";
      }}
    />
  );
}

  if (showAdmin) {
    return (
      <Admin
        onBack={() => setShowAdmin(false)}
      />
    );
  }

  if (showAdminLogin) {
    return (
      <AdminLogin
        onLogin={handleAdminLogin}
        onBack={() => setShowAdminLogin(false)}
      />
    );
  }

  if (showAuth) {
    return (
      <Auth
        onLogin={handleCustomerLogin}
      />
    );
  }

  return (
    <Home
      onLoginClick={() => setShowAuth(true)}
      onAdminClick={() => setShowAdminLogin(true)}
    />
  );
}

export default App;