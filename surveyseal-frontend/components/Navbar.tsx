"use client";

import Link from "next/link";
import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { isConnected, accounts, connect } = useMetaMask();
  const { chainId } = useMetaMaskEthersSigner();
  const pathname = usePathname();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId?: number) => {
    if (!chainId) return "";
    if (chainId === 31337) return "Localhost";
    if (chainId === 11155111) return "Sepolia";
    return `Chain ${chainId}`;
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b glass shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold gradient-text">
            SurveySeal
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                isActive("/")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              Home
            </Link>
            <Link
              href="/create"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                isActive("/create")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              Create Survey
            </Link>
            <Link
              href="/my-answers"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                isActive("/my-answers")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              My Answers
            </Link>
            <Link
              href="/statistics"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                isActive("/statistics")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              Statistics
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isConnected && accounts && accounts.length > 0 ? (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-accent rounded-full">
              <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-background rounded-full">
                {getNetworkName(chainId)}
              </span>
              <span className="text-sm font-mono font-semibold">
                {formatAddress(accounts[0])}
              </span>
            </div>
          ) : (
            <button
              onClick={connect}
              className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

