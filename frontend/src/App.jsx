import { useState } from "react";
import Home from "./Home";
import Auth from "./Auth";
import Admin from "./Admin";
import AdminLogin from "./AdminLogin";
import ResetPassword from "./ResetPassword";

function App() {
  const pathname = window.location.pathname;

  const isAdminPage = pathname === "/admin";
  const isResetPasswordPage =
    pathname.startsWith("/reset-password/");

  const resetToken = pathname.split("/reset-password/")[1];

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

  // PASSWORD RESET PAGE
  if (isResetPasswordPage && resetToken) {
    return (
      <ResetPassword
        token={resetToken}
        onLogin={() => {
          window.location.href = "/";
        }}
      />
    );
  }

  // DIRECT ADMIN PAGE
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

  // ADMIN DASHBOARD
  if (showAdmin) {
    return (
      <Admin
        onBack={() => setShowAdmin(false)}
      />
    );
  }

  // ADMIN LOGIN
  if (showAdminLogin) {
    return (
      <AdminLogin
        onLogin={handleAdminLogin}
        onBack={() => setShowAdminLogin(false)}
      />
    );
  }

  // CUSTOMER LOGIN / REGISTER
  if (showAuth) {
    return (
      <Auth
        onLogin={handleCustomerLogin}
        onAdminClick={() => {
          setShowAuth(false);
          setShowAdminLogin(true);
        }}
      />
    );
  }

  // STORE
  return (
    <Home
      onLoginClick={() => setShowAuth(true)}
      onAdminClick={() => setShowAdminLogin(true)}
    />
  );
}

export default App;