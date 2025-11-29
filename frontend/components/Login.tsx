import React, { useEffect, useState } from "react";

// File: /c:/Users/SMD/Documents/aptos/my-aptos-dapp/frontend/components/Login.tsx

declare global {
    interface Window {
        aptos?: {
            connect?: () => Promise<{ address: string; publicKey?: string }>;
            account?: { address: string; publicKey?: string };
            disconnect?: () => Promise<void>;
            // other wallet-specific members may exist
        };
    }
}

type LoginMethod = "wallet" | "email";

// add role field
export type LoginAccount =
    | { method: "wallet"; address: string; publicKey?: string; canUpload?: boolean; role?: "student" | "admin" }
    | { method: "email"; email: string; canUpload?: boolean; role?: "student" | "admin" };

type Props = {
    // optional callback called after a successful login
    onLogin?: (account: LoginAccount | null) => void;
};

export default function Login({ onLogin }: Props) {
    const [mode, setMode] = useState<LoginMethod>("wallet");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<"student" | "admin" | null>(null);

    // email form
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [account, setAccount] = useState<LoginAccount | null>(null);
    const providerName = window.aptos ? "Aptos Wallet" : null;
    const STORAGE_KEY = "myapp_account";

    useEffect(() => {
        // restore simple session if present in localStorage
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                setAccount(JSON.parse(raw));
            }
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        if (account) {
            onLogin?.(account);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
            } catch {
                // ignore
            }
            // broadcast so other components can react to login
            try {
                window.dispatchEvent(new CustomEvent("myapp:account", { detail: account }));
            } catch {}
        } else {
            localStorage.removeItem(STORAGE_KEY);
            try {
                window.dispatchEvent(new CustomEvent("myapp:account", { detail: null }));
            } catch {}
        }
    }, [account, onLogin]);

    async function connectWallet() {
        setError(null);
        if (!selectedRole) {
            setError("Please select your role (Student or Admin) first.");
            return;
        }
        if (!window.aptos || !window.aptos.connect) {
            setError("No Aptos wallet detected in the browser.");
            return;
        }
        setLoading(true);
        try {
            const resp = await window.aptos.connect();
            const addr = resp?.address ?? window.aptos.account?.address;
            const pk = resp?.publicKey ?? window.aptos.account?.publicKey;
            if (!addr) throw new Error("Failed to obtain wallet address.");
            // admin gets canUpload: true, student gets false
            const canUpload = selectedRole === "admin";
            const acc: LoginAccount = { method: "wallet", address: addr, publicKey: pk, canUpload, role: selectedRole };
            setAccount(acc);
        } catch (err: any) {
            setError(err?.message ?? "Wallet connection failed.");
        } finally {
            setLoading(false);
        }
    }

    async function disconnectWallet() {
        setError(null);
        setLoading(true);
        try {
            if (window.aptos?.disconnect) await window.aptos.disconnect();
            setAccount(null);
        } catch (err: any) {
            setError(err?.message ?? "Disconnect failed.");
        } finally {
            setLoading(false);
        }
    }

    async function submitEmailLogin(e?: React.FormEvent) {
        e?.preventDefault();
        setError(null);
        if (!selectedRole) {
            setError("Please select your role (Student or Admin) first.");
            return;
        }
        if (!email) {
            setError("Enter an email.");
            return;
        }
        setLoading(true);
        try {
            // This is a placeholder for a real authentication call.
            // Replace with your backend/auth provider logic.
            await new Promise((res) => setTimeout(res, 600));
            const canUpload = selectedRole === "admin";
            const acc: LoginAccount = { method: "email", email, canUpload, role: selectedRole };
            setAccount(acc);
        } catch (err: any) {
            setError(err?.message ?? "Email login failed.");
        } finally {
            setLoading(false);
        }
    }

    function logout() {
        setAccount(null);
        setError(null);
    }

    // UI
    return (
        <div className="w-full max-w-md mx-auto p-4 text-center">
            <div className="bg-blue-50 border border-blue-100 rounded-lg shadow-sm p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-full">
                        <h3 className="text-lg font-semibold leading-tight text-blue-700 text-center">Sign in</h3>
                        <p className="text-sm text-blue-600 mt-1 text-center">Select your role and connect</p>
                    </div>
                    <div className="text-xs text-blue-400 hidden md:block">Account</div>
                </div>

                {account ? (
                    <div className="border border-blue-100 rounded-md p-4 bg-white text-center">
                        <div className="mb-3 text-sm text-blue-700">
                            <span className="font-medium">Signed in as {account.role?.toUpperCase()}:</span>{" "}
                            <div className="font-mono mt-1">{account.method === "wallet" ? account.address : account.email}</div>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center">
                            {account.method === "wallet" ? (
                                <button
                                    onClick={disconnectWallet}
                                    disabled={loading}
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded text-sm hover:shadow-sm disabled:opacity-50"
                                >
                                    Disconnect Wallet
                                </button>
                            ) : (
                                <button
                                    onClick={logout}
                                    disabled={loading}
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded text-sm hover:shadow-sm disabled:opacity-50"
                                >
                                    Sign out
                                </button>
                            )}

                            <div className="w-full text-xs text-blue-600 mt-2">
                                Upload access: <span className={`font-medium ${account.canUpload ? "text-green-600" : "text-red-600"}`}>{account.canUpload ? "Enabled" : "Disabled"}</span>
                            </div>

                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent("myapp:navigate", { detail: { to: "dashboard" } }))}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Role selection */}
                        <div className="mb-4">
                            <div className="text-sm font-medium mb-2 text-blue-700">Select your role</div>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setSelectedRole("student")}
                                    className={`flex-1 px-4 py-2 rounded border text-sm transition ${
                                        selectedRole === "student"
                                            ? "bg-blue-700 text-white border-blue-700"
                                            : "bg-white text-gray-700 border-gray-200 hover:shadow"
                                    }`}
                                >
                                    Student
                                </button>
                                <button
                                    onClick={() => setSelectedRole("admin")}
                                    className={`flex-1 px-4 py-2 rounded border text-sm transition ${
                                        selectedRole === "admin"
                                            ? "bg-blue-700 text-white border-blue-700"
                                            : "bg-white text-gray-700 border-gray-200 hover:shadow"
                                    }`}
                                >
                                    Admin
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 mb-4">
                            <button
                                onClick={() => setMode("wallet")}
                                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded border text-sm transition ${
                                    mode === "wallet"
                                        ? "bg-blue-700 text-white border-blue-700"
                                        : "bg-white text-gray-700 border-gray-200 hover:shadow"
                                }`}
                                aria-pressed={mode === "wallet"}
                            >
                                Wallet
                            </button>

                            <button
                                onClick={() => setMode("email")}
                                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded border text-sm transition ${
                                    mode === "email"
                                        ? "bg-blue-700 text-white border-blue-700"
                                        : "bg-white text-gray-700 border-gray-200 hover:shadow"
                                }`}
                                aria-pressed={mode === "email"}
                            >
                                Email
                            </button>
                        </div>

                        {mode === "wallet" ? (
                            <div className="border border-blue-100 rounded-md p-4">
                                <div className="mb-3 text-sm text-blue-600">
                                    {providerName ? (
                                        <div>
                                            Detected wallet: <strong className="text-blue-800">{providerName}</strong>
                                        </div>
                                    ) : (
                                        <div>No Aptos wallet detected in browser.</div>
                                    )}
                                </div>

                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={connectWallet}
                                        disabled={loading || !selectedRole}
                                        className="flex-1 max-w-xs inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-100 to-white border border-blue-300 text-blue-800 rounded hover:from-blue-150 disabled:opacity-50"
                                    >
                                        Connect Wallet
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => window.open("https://aptos.dev/wallets", "_blank")}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded text-sm hover:shadow"
                                    >
                                        Get Wallet
                                    </button>
                                </div>

                                <div className="mt-3 text-xs text-blue-500">
                                    Tip: If you already installed a wallet but it doesn't appear, try refreshing the page.
                                </div>

                                <div className="mt-3">
                                    <button
                                        onClick={() => {
                                            if (!selectedRole) {
                                                setError("Select a role first.");
                                                return;
                                            }
                                            const fake = `0x${Math.floor(Math.random() * 1e16).toString(16)}`;
                                            const canUpload = selectedRole === "admin";
                                            const acc: LoginAccount = { method: "wallet", address: fake, canUpload, role: selectedRole };
                                            setAccount(acc);
                                        }}
                                        className="text-xs text-blue-600 underline"
                                    >
                                        Quick mock connect
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={submitEmailLogin} className="border border-blue-100 rounded-md p-4 space-y-3">
                                <div>
                                    <label className="block text-xs text-blue-600 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-blue-600 mb-1">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="password"
                                        className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>

                                <div className="flex gap-2 justify-center">
                                    <button
                                        type="submit"
                                        disabled={loading || !selectedRole}
                                        className="flex-1 max-w-xs px-3 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                                    >
                                        Sign in
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEmail("");
                                            setPassword("");
                                        }}
                                        className="px-3 py-2 bg-white border rounded text-sm"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                )}

                {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
                {loading && <div className="mt-3 text-sm text-blue-600">Working…</div>}
            </div>
        </div>
    );
}