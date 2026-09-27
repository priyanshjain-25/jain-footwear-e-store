import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [verificationCode, setVerificationCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // REGISTER
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Registration failed");
        return;
      }

      setIsVerifying(true);
      setMessage("Verification code sent to your email.");
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // VERIFY EMAIL
  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/verify-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            code: verificationCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Invalid verification code");
        return;
      }

      setMessage(
        "Email verified successfully. You can now login."
      );

      setIsVerifying(false);
      setIsLogin(true);
      setVerificationCode("");

      setFormData({
        name: "",
        email: formData.email,
        password: "",
        phone: "",
      });
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // RESEND OTP
  const handleResendCode = async () => {
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Unable to resend code"
        );
        return;
      }

      setMessage(
        "New verification code sent successfully."
      );
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setIsVerifying(true);
        }

        setMessage(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      if (onLogin) {
        onLogin(data.user);
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // EMAIL VERIFICATION SCREEN
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2">

          {/* LEFT */}
          <div className="hidden md:flex bg-blue-600 text-white p-12 flex-col justify-center">
            <h1 className="text-4xl font-bold mb-4">
              Jain Footwear
            </h1>

            <p className="text-blue-100 text-lg leading-relaxed">
              Verify your email to securely access your
              Jain Footwear account.
            </p>

            <div className="mt-10 space-y-5">
              <div className="flex gap-4">
                <div className="text-2xl">✓</div>
                <div>
                  <h3 className="font-semibold">
                    Secure Account
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Your account stays protected.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-2xl">✓</div>
                <div>
                  <h3 className="font-semibold">
                    Email Verification
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Only verified emails can login.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="p-8 md:p-12">
            <div className="max-w-md mx-auto">
              <div className="mb-8">
                <p className="text-blue-600 font-semibold text-sm mb-2">
                  EMAIL VERIFICATION
                </p>

                <h2 className="text-3xl font-bold text-gray-900">
                  Verify your email
                </h2>

                <p className="text-gray-500 mt-3">
                  We sent a 6-digit verification code to
                </p>

                <p className="font-semibold text-gray-800 mt-1 break-all">
                  {formData.email}
                </p>
              </div>

              <form
                onSubmit={handleVerify}
                className="space-y-5"
              >
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength="6"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 rounded-xl font-semibold transition"
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </button>
              </form>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="w-full mt-5 text-blue-600 font-semibold hover:text-blue-700"
              >
                Resend verification code
              </button>

              {message && (
                <div className="mt-5 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl p-3 text-sm text-center">
                  {message}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsVerifying(false);
                  setMessage("");
                }}
                className="w-full mt-5 text-gray-500 hover:text-gray-800 text-sm"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2">

        {/* LEFT BRANDING */}
        <div className="hidden md:flex bg-blue-600 text-white p-12 flex-col justify-center">
          <div>
            <p className="text-blue-100 font-semibold mb-3">
              WELCOME TO
            </p>

            <h1 className="text-5xl font-bold leading-tight">
              Jain
              <br />
              Footwear
            </h1>

            <p className="text-blue-100 text-lg mt-6 leading-relaxed">
              Find footwear for every style,
              every occasion and every step.
            </p>
          </div>

          <div className="mt-12 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-xl">
                ✓
              </div>

              <div>
                <p className="font-semibold">
                  Trusted Shopping
                </p>

                <p className="text-blue-100 text-sm">
                  Simple and secure checkout
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-xl">
                ✓
              </div>

              <div>
                <p className="font-semibold">
                  Verified Accounts
                </p>

                <p className="text-blue-100 text-sm">
                  Email verification for security
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-xl">
                ✓
              </div>

              <div>
                <p className="font-semibold">
                  Easy Ordering
                </p>

                <p className="text-blue-100 text-sm">
                  Browse, select and order easily
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="p-8 md:p-12 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-8">
              <p className="text-blue-600 font-semibold text-sm mb-2">
                {isLogin
                  ? "WELCOME BACK"
                  : "JOIN JAIN FOOTWEAR"}
              </p>

              <h2 className="text-3xl font-bold text-gray-900">
                {isLogin
                  ? "Login to your account"
                  : "Create your account"}
              </h2>

              <p className="text-gray-500 mt-2">
                {isLogin
                  ? "Enter your details to continue shopping."
                  : "Create an account to start shopping."}
              </p>
            </div>

            <form
              onSubmit={
                isLogin
                  ? handleLogin
                  : handleRegister
              }
              className="space-y-4"
            >
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Number
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      placeholder="Enter mobile number"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>

                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 rounded-xl font-semibold transition shadow-sm"
              >
                {loading
                  ? isLogin
                    ? "Logging in..."
                    : "Creating account..."
                  : isLogin
                  ? "Login"
                  : "Create Account"}
              </button>
            </form>

            {message && (
              <div className="mt-5 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-center text-gray-700">
                {message}
              </div>
            )}

            <div className="flex items-center gap-3 my-7">
              <div className="h-px bg-gray-200 flex-1"></div>

              <span className="text-gray-400 text-sm">
                OR
              </span>

              <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage("");
              }}
              className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 py-3.5 rounded-xl font-semibold transition"
            >
              {isLogin
                ? "Create a New Account"
                : "Already have an account? Login"}
            </button>

            <p className="text-center text-xs text-gray-400 mt-6">
              By continuing, you agree to Jain Footwear's
              terms and conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;