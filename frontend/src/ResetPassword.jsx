import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function ResetPassword({ token, onLogin }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setSuccess(false);

    if (password.length < 6) {
      setMessage(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Password reset failed."
        );
        return;
      }

      setSuccess(true);
      setMessage(
        "Password reset successfully. You can now login."
      );

      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2">

        {/* LEFT BRANDING */}
        <div className="hidden md:flex bg-blue-600 text-white p-12 flex-col justify-center">
          <p className="text-blue-100 font-semibold mb-3">
            ACCOUNT SECURITY
          </p>

          <h1 className="text-5xl font-bold leading-tight">
            Create
            <br />
            New Password
          </h1>

          <p className="text-blue-100 text-lg mt-6 leading-relaxed">
            Set a new password for your Jain Footwear
            account and continue shopping securely.
          </p>

          <div className="mt-12 space-y-6">

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-xl">
                ✓
              </div>

              <div>
                <p className="font-semibold">
                  Secure Password
                </p>

                <p className="text-blue-100 text-sm">
                  Use at least 6 characters.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-xl">
                ✓
              </div>

              <div>
                <p className="font-semibold">
                  Secure Account
                </p>

                <p className="text-blue-100 text-sm">
                  Your password is securely encrypted.
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
                RESET PASSWORD
              </p>

              <h2 className="text-3xl font-bold text-gray-900">
                Create a new password
              </h2>

              <p className="text-gray-500 mt-2">
                Enter your new password below.
              </p>
            </div>

            {success ? (
              <>
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-center">
                  {message}
                </div>

                <button
                  type="button"
                  onClick={onLogin}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold transition"
                >
                  Go to Login
                </button>
              </>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* NEW PASSWORD */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    required
                    minLength="6"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />

                  <label className="flex items-center gap-2 mt-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) =>
                        setShowPassword(
                          e.target.checked
                        )
                      }
                      className="w-4 h-4"
                    />

                    Show password
                  </label>
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    required
                    minLength="6"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />

                  <label className="flex items-center gap-2 mt-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showConfirmPassword}
                      onChange={(e) =>
                        setShowConfirmPassword(
                          e.target.checked
                        )
                      }
                      className="w-4 h-4"
                    />

                    Show confirm password
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 rounded-xl font-semibold transition shadow-sm"
                >
                  {loading
                    ? "Resetting Password..."
                    : "Reset Password"}
                </button>

              </form>
            )}

            {message && !success && (
              <div className="mt-5 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm text-center">
                {message}
              </div>
            )}

            {!success && (
              <button
                type="button"
                onClick={onLogin}
                className="w-full mt-5 text-gray-500 hover:text-gray-800 text-sm"
              >
                ← Back to Login
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;