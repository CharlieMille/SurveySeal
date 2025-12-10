"use client";

import { Navbar } from "@/components/Navbar";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useFhevm } from "@/fhevm/useFhevm";
import { useSurveySeal } from "@/hooks/useSurveySeal";
import { useEffect, useState } from "react";
import Link from "next/link";

interface AnsweredSurvey {
  id: number;
  creator: string;
  title: string;
  description: string;
  createdAt: number;
}

export default function MyAnswersPage() {
  const { isConnected, accounts, ethersReadonlyProvider, provider, chainId, sameChain, sameSigner } = useMetaMaskEthersSigner();
  const { storage } = useInMemoryStorage();
  const { instance } = useFhevm();
  const { getMyAnsweredSurveys, contractAddress } = useSurveySeal({
    instance,
    fhevmDecryptionSignatureStorage: storage,
    eip1193Provider: provider,
    chainId,
    ethersSigner: undefined,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [answeredSurveys, setAnsweredSurveys] = useState<AnsweredSurvey[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isConnected || !accounts || !getMyAnsweredSurveys || !contractAddress) {
      setAnsweredSurveys([]);
      return;
    }

    const loadAnsweredSurveys = async () => {
      try {
        setLoading(true);
        const surveys = await getMyAnsweredSurveys(accounts[0]);
        setAnsweredSurveys(surveys);
      } catch (err) {
        console.error("Failed to load answered surveys:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAnsweredSurveys();
  }, [isConnected, accounts, getMyAnsweredSurveys, contractAddress]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl font-bold mb-3 gradient-text">My Answers</h1>
            <p className="text-muted-foreground">
              View all surveys you've answered
            </p>
          </div>

          {!isConnected ? (
            <div className="glass rounded-2xl p-12 text-center shadow-lg">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-muted-foreground text-lg">
                Please connect your wallet to view your answered surveys
              </p>
            </div>
          ) : loading ? (
            <div className="glass rounded-2xl p-12 text-center shadow-lg">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Loading your answered surveys...</p>
              </div>
            </div>
          ) : answeredSurveys.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center shadow-lg">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-muted-foreground mb-6 text-lg">
                You haven't answered any surveys yet
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
              >
                Browse Surveys
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {answeredSurveys.map((survey) => (
                <div
                  key={survey.id}
                  className="glass rounded-2xl p-6 card-hover shadow-lg border-l-4 border-l-primary"
                >
                  <div className="flex items-start justify-between mb-4">
                    <Link
                      href={`/survey/${survey.id}`}
                      className="flex-1 group"
                    >
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {survey.title}
                      </h3>
                    </Link>
                    <Link
                      href={`/statistics/${survey.id}`}
                      className="px-4 py-2 text-sm bg-gradient-to-r from-primary/10 to-primary/5 text-primary rounded-xl hover:from-primary/20 hover:to-primary/10 transition-all font-semibold border border-primary/20"
                    >
                      View Stats
                    </Link>
                  </div>
                  {survey.description && (
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {survey.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-accent rounded-full text-muted-foreground font-medium">
                        {survey.creator.slice(0, 6)}...{survey.creator.slice(-4)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(survey.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

