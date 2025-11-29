import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
// Internal Components
import { Header } from "@/components/Header";
import { TopBanner } from "@/components/TopBanner";
import Login from "@/components/Login";
import AdminPage from "@/components/AdminPage";
import StudentPage from "@/components/StudentPage";
import WalletPage from "@/components/WalletPage";
import RegisterPage from "@/components/RegisterPage";

type LoginAccount = {
  method: "wallet" | "email";
  address?: string;
  email?: string;
  role?: "student" | "admin";
  canUpload?: boolean;
};

type Page = "login" | "register" | "admin" | "student" | "wallet";

function App() {
  const { connected } = useWallet();
  const [account, setAccount] = useState<LoginAccount | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>("login");

  useEffect(() => {
    // load initial account from localStorage
    try {
      const raw = localStorage.getItem("myapp_account");
      if (raw) {
        const acc = JSON.parse(raw);
        setAccount(acc);
        // auto-navigate to role page if logged in
        if (acc.role === "admin") setCurrentPage("admin");
        else if (acc.role === "student") setCurrentPage("student");
      }
    } catch {}

    // listen for login/logout events
    const handler = (e: any) => {
      const acc = e?.detail ?? null;
      setAccount(acc);
      if (!acc) setCurrentPage("login");
      else if (acc.role === "admin") setCurrentPage("admin");
      else if (acc.role === "student") setCurrentPage("student");
    };
    window.addEventListener("myapp:account", handler as EventListener);

    // listen for navigation events
    const navHandler = (e: any) => {
      const to = e?.detail?.to;
      if (to === "wallet") setCurrentPage("wallet");
      else if (to === "dashboard") {
        if (account?.role === "admin") setCurrentPage("admin");
        else if (account?.role === "student") setCurrentPage("student");
      }
    };
    window.addEventListener("myapp:navigate", navHandler as EventListener);

    return () => {
      window.removeEventListener("myapp:account", handler as EventListener);
      window.removeEventListener("myapp:navigate", navHandler as EventListener);
    };
  }, [account]);

  return (
    <>
      <TopBanner />
      <Header />
      
      {/* Navigation bar if logged in */}
      {account && (
        <div className="w-full bg-white border-b shadow-sm">
          <div className="max-w-6xl mx-auto flex gap-4 px-6 py-3 items-center">
            <button
              onClick={() => setCurrentPage(account.role === "admin" ? "admin" : "student")}
              className={`px-3 py-1 rounded text-sm ${currentPage === account.role ? "bg-blue-600 text-white" : "bg-white border"}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage("wallet")}
              className={`px-3 py-1 rounded text-sm ${currentPage === "wallet" ? "bg-blue-600 text-white" : "bg-white border"}`}
            >
              Wallet
            </button>
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">
                  {account.name || (account.method === "wallet" ? "Wallet User" : "User")}
                </div>
                <div className="text-xs text-gray-500">{account.role?.toUpperCase()}</div>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {account.name ? account.name.charAt(0).toUpperCase() : account.role?.charAt(0).toUpperCase() || "U"}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center flex-col gap-8 py-8">
        {currentPage === "login" && (
          <Login
            onLogin={(acc) => setAccount(acc)}
            onRegisterClick={() => setCurrentPage("register")}
          />
        )}
        {currentPage === "register" && (
          <RegisterPage
            onBack={() => setCurrentPage("login")}
            onRegisterSuccess={() => setCurrentPage("login")}
          />
        )}
        {currentPage === "admin" && account?.role === "admin" && <AdminPage />}
        {currentPage === "student" && account?.role === "student" && <StudentPage />}
        {currentPage === "wallet" && account && <WalletPage />}
      </div>
    </>
  );
}

export default App;
