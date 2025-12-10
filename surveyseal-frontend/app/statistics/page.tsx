"use client";

import { Navbar } from "@/components/Navbar";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useFhevm } from "@/fhevm/useFhevm";
import { useSurveySeal } from "@/hooks/useSurveySeal";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";

export default function StatisticsPage() {
  const { isConnected, accounts, ethersReadonlyProvider, provider, chainId, sameChain, sameSigner } = useMetaMaskEthersSigner();
  const { storage } = useInMemoryStorage();
  const { instance } = useFhevm();
  const { contractAddress } = useSurveySeal({
    instance,
    fhevmDecryptionSignatureStorage: storage,
    eip1193Provider: provider,
    chainId,
    ethersSigner: undefined,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [mySurveys, setMySurveys] = useState<Array<{ id: number; title: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isConnected || !accounts || !contractAddress || !ethersReadonlyProvider) {
      setLoading(false);
      return;
    }

    const loadMySurveys = async () => {
      try {
        setLoading(true);
        const contract = new ethers.Contract(
          contractAddress,
          [
            "function getSurveyCount() external view returns (uint256)",
            "function getSurvey(uint256) external view returns (tuple(address creator, string title, string description, string[] questions, uint8[] questionTypes, uint256[] optionCounts, uint256 createdAt, bool isActive))",
          ],
          ethersReadonlyProvider
        );

        const count = await contract.getSurveyCount();
        const surveys: Array<{ id: number; title: string }> = [];

        for (let i = 0; i < Number(count); i++) {
          try {
            const survey = await contract.getSurvey(i);
            if (survey.creator.toLowerCase() === accounts[0].toLowerCase()) {
              surveys.push({ id: i, title: survey.title });
            }
          } catch {
            continue;
          }
        }

        setMySurveys(surveys);
      } catch (err) {
        console.error("Failed to load surveys:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMySurveys();
  }, [isConnected, accounts, contractAddress, ethersReadonlyProvider]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-10">
              <h1 className="text-4xl font-bold mb-3 gradient-text">Statistics</h1>
              <p className="text-muted-foreground">
                View statistics for your surveys
              </p>
            </div>
            <div className="glass rounded-2xl p-12 text-center shadow-lg">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-muted-foreground text-lg">
                Please connect your wallet to view statistics
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl font-bold mb-3 gradient-text">Statistics</h1>
            <p className="text-muted-foreground">
              View statistics for your surveys
            </p>
          </div>

          {loading ? (
            <div className="glass rounded-2xl p-12 text-center shadow-lg">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Loading your surveys...</p>
              </div>
            </div>
          ) : mySurveys.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center shadow-lg">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-muted-foreground text-lg">
                You haven't created any surveys yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mySurveys.map((survey) => (
                <Link
                  key={survey.id}
                  href={`/statistics/${survey.id}`}
                  className="block glass rounded-2xl p-6 card-hover shadow-lg border-l-4 border-l-primary group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{survey.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Survey ID: {survey.id}
                      </p>
                    </div>
                    <svg className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

