import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
// Internal Components
import { Header } from "@/components/Header";
import { TopBanner } from "@/components/TopBanner";
import Login from "@/components/Login";
import AdminPage from "@/components/AdminPage";
import StudentPage from "@/components/StudentPage";

type LoginAccount = {
  method: "wallet" | "email";
  address?: string;
  email?: string;
  role?: "student" | "admin";
  canUpload?: boolean;
};

function App() {
  const { connected } = useWallet();
  const [account, setAccount] = useState<LoginAccount | null>(null);

  useEffect(() => {
    // load initial account from localStorage
    try {
      const raw = localStorage.getItem("myapp_account");
      if (raw) setAccount(JSON.parse(raw));
    } catch {}

    // listen for login/logout events
    const handler = (e: any) => {
      setAccount(e?.detail ?? null);
    };
    window.addEventListener("myapp:account", handler as EventListener);
    return () => window.removeEventListener("myapp:account", handler as EventListener);
  }, []);

  return (
    <>
      <TopBanner />
      <Header />
      <div className="flex items-center justify-center flex-col gap-8 py-8">
        {!account && <Login onLogin={(acc) => setAccount(acc)} />}
        {account && account.role === "admin" && <AdminPage />}
        {account && account.role === "student" && <StudentPage />}
      </div>
    </>
  );
}

export default App;
