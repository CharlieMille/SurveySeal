"use client";

import { useEffect, useState } from "react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useFhevm } from "@/fhevm/useFhevm";
import { useSurveySeal } from "@/hooks/useSurveySeal";

interface SurveyData {
  creator: string;
  title: string;
  description: string;
  questions: string[];
  questionTypes: number[];
  optionCounts: number[];
  createdAt: number;
  isActive: boolean;
}

export function StatisticsContent({ surveyId }: { surveyId: string }) {
  const { isConnected, accounts, ethersSigner, ethersReadonlyProvider, provider, chainId, sameChain, sameSigner } = useMetaMaskEthersSigner();
  const { storage } = useInMemoryStorage();
  const { instance } = useFhevm();
  const { getSurvey, getStatistics, isLoading, error, message } = useSurveySeal({
    instance,
    fhevmDecryptionSignatureStorage: storage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [survey, setSurvey] = useState<SurveyData | undefined>(undefined);
  const [stats, setStats] = useState<bigint[][] | undefined>(undefined);
  const [loadingSurvey, setLoadingSurvey] = useState<boolean>(true);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [accessError, setAccessError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isConnected || !getSurvey || !accounts) {
      return;
    }

    const loadSurvey = async () => {
      try {
        setLoadingSurvey(true);
        const surveyData = await getSurvey(BigInt(surveyId));
        if (surveyData) {
          setSurvey(surveyData);
          if (surveyData.creator.toLowerCase() !== accounts[0].toLowerCase()) {
            setAccessError("Only the survey creator can view statistics");
          } else {
            setAccessError(undefined);
          }
        }
      } catch (err) {
        console.error("Failed to load survey:", err);
      } finally {
        setLoadingSurvey(false);
      }
    };

    loadSurvey();
  }, [surveyId, isConnected, getSurvey, accounts]);

  const loadStatistics = async () => {
    if (!getStatistics || !survey) {
      return;
    }

    try {
      setLoadingStats(true);
      const statistics = await getStatistics(BigInt(surveyId));
      if (statistics) {
        setStats(statistics);
      }
    } catch (err) {
      console.error("Failed to load statistics:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (survey && survey.creator.toLowerCase() === accounts?.[0]?.toLowerCase()) {
      loadStatistics();
    }
  }, [survey, accounts]);

  if (!isConnected) {
    return (
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
    );
  }

  if (loadingSurvey) {
    return (
      <div className="glass rounded-2xl p-12 text-center shadow-lg">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="glass rounded-2xl p-12 text-center shadow-lg">
        <p className="text-muted-foreground text-lg">Survey not found</p>
      </div>
    );
  }

  if (accessError || (survey.creator.toLowerCase() !== accounts?.[0]?.toLowerCase())) {
    return (
      <div className="glass rounded-2xl p-12 text-center shadow-lg border-2 border-destructive/20">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-destructive text-lg font-semibold">
          {accessError || "Only the survey creator can view statistics"}
        </p>
      </div>
    );
  }

  if (loadingStats) {
    return (
      <div className="glass rounded-2xl p-12 text-center shadow-lg">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="glass rounded-2xl p-12 text-center shadow-lg">
        <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-muted-foreground mb-6 text-lg">
          No statistics available yet
        </p>
        <button
          onClick={loadStatistics}
          className="px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="glass rounded-2xl p-8 shadow-lg border-l-4 border-l-primary">
        <h2 className="text-3xl font-bold mb-4 gradient-text">{survey.title}</h2>
        {survey.description && (
          <p className="text-muted-foreground mb-4 text-lg">{survey.description}</p>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 border-2 border-destructive rounded-xl p-4">
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}

      {message && (
        <div className="glass border-2 border-primary/20 rounded-xl p-4">
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}

      <div className="space-y-6">
        {survey.questions.map((question, qIndex) => {
          const questionType = survey.questionTypes[qIndex];
          const optionCount = survey.optionCounts[qIndex];
          const questionStats = stats[qIndex] || [];

          const total = questionStats.reduce((sum, val) => sum + val, BigInt(0));

          return (
            <div key={qIndex} className="glass rounded-2xl p-6 shadow-lg border-l-4 border-l-primary/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">{qIndex + 1}</span>
                </div>
                <h3 className="text-lg font-bold">
                  {question}
                </h3>
              </div>

              {questionType === 0 && (
                <div className="space-y-4">
                  {Array.from({ length: optionCount }).map((_, optIndex) => {
                    const count = questionStats[optIndex] || BigInt(0);
                    const percentage =
                      total > 0
                        ? Number((count * BigInt(100)) / total)
                        : 0;
                    return (
                      <div key={optIndex} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Option {optIndex + 1}</span>
                          <span className="text-sm text-muted-foreground font-medium">
                            {count.toString()} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {questionType === 1 && (
                <div className="space-y-3">
                  {Array.from({ length: optionCount }).map((_, optIndex) => {
                    const count = questionStats[optIndex] || BigInt(0);
                    return (
                      <div key={optIndex} className="flex items-center justify-between p-3 bg-accent rounded-xl">
                        <span className="font-semibold">Option {optIndex + 1}</span>
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-bold">
                          {count.toString()} selections
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {questionType === 2 && (
                <div className="space-y-4">
                  {Array.from({ length: optionCount }).map((_, optIndex) => {
                    const count = questionStats[optIndex] || BigInt(0);
                    const percentage =
                      total > 0
                        ? Number((count * BigInt(100)) / total)
                        : 0;
                    return (
                      <div key={optIndex} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold flex items-center gap-2">
                            <span className="text-2xl">⭐</span>
                            {optIndex + 1} star{optIndex !== 0 ? "s" : ""}
                          </span>
                          <span className="text-sm text-muted-foreground font-medium">
                            {count.toString()} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {total > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📊</span>
                        <p className="text-lg font-bold">
                          Average Rating:{" "}
                          <span className="text-primary">
                            {Number(
                              questionStats.reduce(
                                (sum, val, idx) => sum + val * BigInt(idx + 1),
                                BigInt(0)
                              ) / total
                            ).toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {questionType === 3 && (
                <div className="space-y-4">
                  {total > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-accent rounded-xl text-center">
                        <p className="text-sm text-muted-foreground mb-1">Total Responses</p>
                        <p className="text-2xl font-bold text-primary">{questionStats[1]?.toString() || "0"}</p>
                      </div>
                      <div className="p-4 bg-accent rounded-xl text-center">
                        <p className="text-sm text-muted-foreground mb-1">Sum</p>
                        <p className="text-2xl font-bold text-primary">{questionStats[0]?.toString() || "0"}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl text-center border-2 border-primary/20">
                        <p className="text-sm text-muted-foreground mb-1">Average</p>
                        <p className="text-2xl font-bold text-primary">
                          {questionStats[1] && questionStats[1] > 0
                            ? Number(
                                questionStats[0] / questionStats[1]
                              ).toFixed(2)
                            : "0"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={loadStatistics}
        disabled={isLoading}
        className="w-full px-6 py-4 bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground rounded-xl hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-secondary-foreground"></div>
            Refreshing...
          </span>
        ) : (
          "Refresh Statistics"
        )}
      </button>
    </div>
  );
}

