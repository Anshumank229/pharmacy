// frontend/src/pages/TwoFactorVerify.jsx
// UPGRADE 2: Admin 2FA verification page
// Shown after admin password login when 2FA is enabled.
// Submits a 6-digit TOTP code to POST /api/2fa/login.

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosClient";

export default function TwoFactorVerify() {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Auto-focus on mount for seamless UX
        inputRef.current?.focus();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (code.length !== 6) {
            setError("Please enter a 6-digit code");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const { data } = await api.post("/2fa/login", { token: code });
            // On success, server sets full auth cookies
            // Navigate to admin dashboard
            navigate("/admin/dashboard", { replace: true });
        } catch (err) {
            const msg = err.response?.data?.message || "Verification failed. Please try again.";
            setError(msg);
            setCode("");
            inputRef.current?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleCodeChange = (e) => {
        // Only allow digits, max 6 characters
        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
        setCode(value);
        if (error) setError("");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Two-Factor Verification</h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        Enter the 6-digit code from your authenticator app
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="otp-code" className="block text-sm font-medium text-gray-700 mb-2">
                            Verification Code
                        </label>
                        <input
                            id="otp-code"
                            ref={inputRef}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="one-time-code"
                            placeholder="000000"
                            value={code}
                            onChange={handleCodeChange}
                            maxLength={6}
                            className="w-full text-center text-3xl font-mono tracking-[0.5em] border-2 border-gray-200 rounded-xl px-4 py-4 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            disabled={loading}
                        />
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || code.length !== 6}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Verifying…
                            </>
                        ) : (
                            "Verify & Continue"
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">
                        Code not working?{" "}
                        <a
                            href="/admin-login"
                            className="text-indigo-500 hover:text-indigo-700 font-medium underline-offset-2 hover:underline"
                        >
                            Back to login
                        </a>
                    </p>
                    <p className="text-xs text-gray-300 mt-2">
                        This session expires in 5 minutes
                    </p>
                </div>
            </div>
        </div>
    );
}
