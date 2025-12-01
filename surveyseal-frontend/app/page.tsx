"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useFhevm } from "@/fhevm/useFhevm";
import { useSurveySeal } from "@/hooks/useSurveySeal";
import { useEffect, useState } from "react";

interface SurveyListItem {
  id: number;
  creator: string;
  title: string;
  description: string;
  createdAt: number;
  isActive: boolean;
}

export default function Home() {
  const { isConnected } = useMetaMask();
  const { ethersReadonlyProvider, provider, chainId, sameChain, sameSigner } = useMetaMaskEthersSigner();
  const { storage } = useInMemoryStorage();
  const { instance } = useFhevm();
  const { getAllSurveys, contractAddress } = useSurveySeal({
    instance,
    fhevmDecryptionSignatureStorage: storage,
    eip1193Provider: provider,
    chainId,
    ethersSigner: undefined,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isConnected || !getAllSurveys || !contractAddress) {
      setSurveys([]);
      return;
    }

    const loadSurveys = async () => {
      try {
        setLoading(true);
        const surveyList = await getAllSurveys();
        setSurveys(surveyList);
      } catch (err) {
        console.error("Failed to load surveys:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSurveys();
  }, [isConnected, getAllSurveys, contractAddress]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block mb-6">
                <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                  🔒 Fully Encrypted
                </span>
              </div>
              <h1 className="text-6xl md:text-7xl font-bold mb-6 gradient-text">
                SurveySeal
              </h1>
              <p className="text-2xl md:text-3xl text-muted-foreground mb-4 font-light">
                Privacy-Preserving Surveys
              </p>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
                Create and answer surveys with homomorphic encryption. Your data stays encrypted throughout the entire process, ensuring complete privacy and security.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {!isConnected ? (
                  <>
                    <div className="px-6 py-3 bg-accent rounded-xl text-muted-foreground">
                      Connect wallet to get started
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href="/create"
                      className="px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 font-bold text-lg"
                    >
                      Create Survey
                    </Link>
                    <Link
                      href="/my-answers"
                      className="px-8 py-4 glass border-2 border-primary/20 text-foreground rounded-xl hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 font-semibold"
                    >
                      My Answers
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
                  Why SurveySeal?
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Built with cutting-edge encryption technology
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="glass rounded-2xl p-8 card-hover shadow-lg text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Fully Encrypted</h3>
                  <p className="text-muted-foreground">
                    All answers are encrypted using homomorphic encryption. Even we can't see your responses.
                  </p>
                </div>

                <div className="glass rounded-2xl p-8 card-hover shadow-lg text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Privacy First</h3>
                  <p className="text-muted-foreground">
                    Your privacy is our priority. Individual answers remain completely anonymous and encrypted.
                  </p>
                </div>

                <div className="glass rounded-2xl p-8 card-hover shadow-lg text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Real Statistics</h3>
                  <p className="text-muted-foreground">
                    Get accurate aggregated statistics without compromising individual privacy. Only survey creators can decrypt results.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Start Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
                  Get Started
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Start creating or answering surveys in minutes
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-16">
                <Link
                  href="/create"
                  className="group glass rounded-2xl p-8 card-hover shadow-lg"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-3">Create Survey</h2>
                  <p className="text-muted-foreground mb-6">
                    Create encrypted surveys with multiple question types including single choice, multiple choice, rating, and numeric input.
                  </p>
                  <span className="inline-flex items-center text-primary font-semibold group-hover:translate-x-1 transition-transform">
                    Get Started
                    <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>

                <div className="glass rounded-2xl p-8 shadow-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-3">Browse Surveys</h2>
                  <p className="text-muted-foreground mb-6">
                    View and answer available surveys from the community. All answers are encrypted before submission.
                  </p>
                  {!isConnected ? (
                    <div className="text-sm text-muted-foreground py-4">
                      Connect your wallet to view surveys
                    </div>
                  ) : loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : surveys.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-4 text-center">
                      No surveys available yet. Be the first to create one!
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {surveys.map((survey) => (
                        <Link
                          key={survey.id}
                          href={`/survey/${survey.id}`}
                          className="block p-4 border rounded-xl hover:bg-accent hover:border-primary/50 transition-all group"
                        >
                          <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{survey.title}</h3>
                          {survey.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {survey.description}
                            </p>
                          )}
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-accent rounded-full">
                              {survey.creator.slice(0, 6)}...{survey.creator.slice(-4)}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Available Surveys Section */}
        {isConnected && (
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
                    Available Surveys
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Browse and answer surveys from the community
                  </p>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : surveys.length === 0 ? (
                  <div className="glass rounded-2xl p-12 text-center shadow-lg">
                    <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-muted-foreground text-lg mb-6">
                      No surveys available yet. Be the first to create one!
                    </p>
                    <Link
                      href="/create"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
                    >
                      Create Survey
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {surveys.map((survey) => (
                      <Link
                        key={survey.id}
                        href={`/survey/${survey.id}`}
                        className="glass rounded-2xl p-6 card-hover shadow-lg border-l-4 border-l-primary group"
                      >
                        <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {survey.title}
                        </h3>
                        {survey.description && (
                          <p className="text-muted-foreground mb-4 line-clamp-3 text-sm">
                            {survey.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <span className="px-3 py-1 bg-accent rounded-full text-xs text-muted-foreground font-medium">
                            {survey.creator.slice(0, 6)}...{survey.creator.slice(-4)}
                          </span>
                          <span className="inline-flex items-center text-primary text-sm font-semibold group-hover:translate-x-1 transition-transform">
                            View
                            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* How It Works Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
                  How It Works
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Simple, secure, and privacy-focused
                </p>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <h3 className="font-bold mb-2">Connect Wallet</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your Web3 wallet to get started
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">2</span>
                  </div>
                  <h3 className="font-bold mb-2">Create or Answer</h3>
                  <p className="text-sm text-muted-foreground">
                    Create your survey or browse existing ones
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">3</span>
                  </div>
                  <h3 className="font-bold mb-2">Encrypt & Submit</h3>
                  <p className="text-sm text-muted-foreground">
                    Answers are encrypted before submission
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">4</span>
                  </div>
                  <h3 className="font-bold mb-2">View Statistics</h3>
                  <p className="text-sm text-muted-foreground">
                    Survey creators can decrypt aggregated results
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
