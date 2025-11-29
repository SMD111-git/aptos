import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";

export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between p-4 bg-gray-900 text-white shadow-lg">
      <h1 className="text-xl font-bold">Aptos dApp</h1>
      <WalletSelector />
    </nav>
  );
}
