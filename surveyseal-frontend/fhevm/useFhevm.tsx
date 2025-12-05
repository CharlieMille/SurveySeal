"use client";

import { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import { FhevmInstance } from "./fhevmTypes";
import { createFhevmInstance } from "./internal/fhevm";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";

export function useFhevm() {
  const { provider, chainId, isConnected } = useMetaMaskEthersSigner();
  const [instance, setInstance] = useState<FhevmInstance | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  const abortControllerRef = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    if (!isConnected || !provider || !chainId) {
      setInstance(undefined);
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(undefined);

    const mockChains: Record<number, string> = {
      31337: "http://localhost:8545",
    };

    createFhevmInstance({
      provider,
      mockChains,
      signal: abortController.signal,
      onStatusChange: (status) => {
        console.log(`[useFhevm] status: ${status}`);
      },
    })
      .then((inst) => {
        if (!abortController.signal.aborted) {
          setInstance(inst);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!abortController.signal.aborted) {
          setError(err);
          setIsLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [isConnected, provider, chainId]);

  return { instance, isLoading, error };
}


