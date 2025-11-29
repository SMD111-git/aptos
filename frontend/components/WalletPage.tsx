import React, { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownLeft, Wallet, RefreshCw } from "lucide-react";

type Transaction = {
  id: string;
  type: "send" | "receive";
  amount: number;
  to?: string;
  from?: string;
  timestamp: number;
  status: "pending" | "success" | "failed";
};

const ACCOUNT_KEY = "myapp_account";
const WALLET_KEY = "myapp_wallet";
const TX_KEY = "myapp_transactions";

export default function WalletPage(): JSX.Element {
  const [account, setAccount] = useState<any | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipientAddr, setRecipientAddr] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // load account
    try {
      const raw = localStorage.getItem(ACCOUNT_KEY);
      if (raw) setAccount(JSON.parse(raw));
    } catch {}

    // load wallet data
    try {
      const wRaw = localStorage.getItem(WALLET_KEY);
      if (wRaw) {
        const w = JSON.parse(wRaw);
        setBalance(w.balance ?? 0);
      } else {
        // initialize mock wallet with some balance
        const initWallet = { balance: 100 };
        localStorage.setItem(WALLET_KEY, JSON.stringify(initWallet));
        setBalance(100);
      }
    } catch {}

    // load transactions
    try {
      const txRaw = localStorage.getItem(TX_KEY);
      if (txRaw) setTransactions(JSON.parse(txRaw));
    } catch {}

    // listen for account changes
    const handler = (e: any) => {
      setAccount(e?.detail ?? null);
    };
    window.addEventListener("myapp:account", handler as EventListener);
    return () => window.removeEventListener("myapp:account", handler as EventListener);
  }, []);

  function persistWallet(newBalance: number) {
    setBalance(newBalance);
    try {
      localStorage.setItem(WALLET_KEY, JSON.stringify({ balance: newBalance }));
    } catch {}
  }

  function persistTransactions(txs: Transaction[]) {
    setTransactions(txs);
    try {
      localStorage.setItem(TX_KEY, JSON.stringify(txs));
    } catch {}
  }

  async function refreshBalance() {
    setLoading(true);
    setMessage(null);
    try {
      // TODO: call real Aptos SDK to fetch balance
      await new Promise((res) => setTimeout(res, 800));
      // mock: randomly add a bit to balance for demo
      const newBal = balance + Math.floor(Math.random() * 5);
      persistWallet(newBal);
      setMessage("Balance refreshed.");
    } catch {
      setMessage("Failed to refresh balance.");
    } finally {
      setLoading(false);
    }
  }

  async function sendTokens(e?: React.FormEvent) {
    e?.preventDefault();
    setMessage(null);
    if (!recipientAddr || !amount) {
      setMessage("Recipient address and amount are required.");
      return;
    }
    const sendAmt = parseFloat(amount);
    if (isNaN(sendAmt) || sendAmt <= 0) {
      setMessage("Invalid amount.");
      return;
    }
    if (sendAmt > balance) {
      setMessage("Insufficient balance.");
      return;
    }

    setSending(true);
    try {
      // TODO: use Aptos SDK to submit transaction
      await new Promise((res) => setTimeout(res, 1000));
      const tx: Transaction = {
        id: Math.random().toString(36).slice(2, 9),
        type: "send",
        amount: sendAmt,
        to: recipientAddr,
        timestamp: Date.now(),
        status: "success",
      };
      const newBal = balance - sendAmt;
      persistWallet(newBal);
      persistTransactions([tx, ...transactions]);
      setMessage(`Sent ${sendAmt} APT to ${recipientAddr}`);
      setRecipientAddr("");
      setAmount("");
    } catch {
      setMessage("Transaction failed.");
    } finally {
      setSending(false);
    }
  }

  function mockReceive() {
    // dev helper: simulate receiving tokens
    const recvAmt = 10;
    const tx: Transaction = {
      id: Math.random().toString(36).slice(2, 9),
      type: "receive",
      amount: recvAmt,
      from: "0xMockSender",
      timestamp: Date.now(),
      status: "success",
    };
    const newBal = balance + recvAmt;
    persistWallet(newBal);
    persistTransactions([tx, ...transactions]);
    setMessage(`Received ${recvAmt} APT (mock).`);
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white border border-blue-100 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8 text-blue-700" />
            <div>
              <h2 className="text-2xl font-semibold text-blue-700">My Wallet</h2>
              <p className="text-sm text-blue-600">Manage your APT tokens</p>
            </div>
          </div>
          <button
            onClick={refreshBalance}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm hover:bg-blue-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {!account && (
          <div className="text-center p-4 bg-blue-50 border border-blue-100 rounded mb-4">
            <div className="mb-2">No account detected. Please sign in to use wallet.</div>
          </div>
        )}

        {account && (
          <>
            {/* User Profile Card */}
            <div className="mb-4 border border-blue-100 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {account.name ? account.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-blue-900">{account.name || "User"}</div>
                  <div className="text-xs text-gray-600">
                    {account.method === "wallet" ? account.address : account.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Balance Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="text-sm text-blue-600 mb-1">Available Balance</div>
              <div className="text-4xl font-bold text-blue-900">{balance.toFixed(2)} <span className="text-2xl">APT</span></div>
              <div className="text-xs text-blue-500 mt-2">
                Account: {account.method === "wallet" ? account.address : account.email}
              </div>
            </div>

            {/* Send Tokens Form */}
            <div className="border border-blue-100 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-blue-700 mb-3 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5" />
                Send Tokens
              </h3>
              <form onSubmit={sendTokens} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Recipient Address</label>
                  <input
                    value={recipientAddr}
                    onChange={(e) => setRecipientAddr(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount (APT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={sending || !account}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientAddr("");
                      setAmount("");
                    }}
                    className="px-4 py-2 bg-white border rounded"
                  >
                    Clear
                  </button>
                </div>
              </form>

              <div className="mt-3">
                <button
                  onClick={mockReceive}
                  className="text-xs text-blue-600 underline"
                >
                  Mock receive tokens (dev)
                </button>
              </div>
            </div>

            {/* Transaction History */}
            <div className="border border-blue-100 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-700 mb-3">Transaction History</h3>
              {transactions.length === 0 ? (
                <div className="text-sm text-gray-500">No transactions yet.</div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-3">
                        {tx.type === "send" ? (
                          <ArrowUpRight className="w-5 h-5 text-red-500" />
                        ) : (
                          <ArrowDownLeft className="w-5 h-5 text-green-500" />
                        )}
                        <div>
                          <div className="text-sm font-medium">
                            {tx.type === "send" ? "Sent" : "Received"} {tx.amount.toFixed(2)} APT
                          </div>
                          <div className="text-xs text-gray-500">
                            {tx.type === "send" ? `To: ${tx.to}` : `From: ${tx.from}`}
                          </div>
                          <div className="text-xs text-gray-400">{new Date(tx.timestamp).toLocaleString()}</div>
                        </div>
                      </div>
                      <div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            tx.status === "success"
                              ? "bg-green-100 text-green-700"
                              : tx.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {message && <div className="mt-4 text-center text-sm text-gray-700">{message}</div>}
          </>
        )}

        <div className="mt-6 text-xs text-gray-500">
          Note: this is a demo wallet with mock transactions. Integrate with Aptos SDK for real blockchain operations.
        </div>
      </div>
    </div>
  );
}
