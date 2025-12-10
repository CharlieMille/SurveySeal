"use client";

import { useEffect, useState } from "react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useFhevm } from "@/fhevm/useFhevm";
import { useSurveySeal } from "@/hooks/useSurveySeal";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";

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

export function SurveyContent({ surveyId }: { surveyId: string }) {
  const router = useRouter();
  const { isConnected, ethersSigner, ethersReadonlyProvider, provider, chainId, sameChain, sameSigner } = useMetaMaskEthersSigner();
  const { storage } = useInMemoryStorage();
  const { instance } = useFhevm();
  const { getSurvey, submitAnswer, isLoading, error, message } = useSurveySeal({
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
  const [answers, setAnswers] = useState<number[][]>([]);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [loadingSurvey, setLoadingSurvey] = useState<boolean>(true);

  useEffect(() => {
    if (!isConnected || !getSurvey) {
      return;
    }

    const loadSurvey = async () => {
      try {
        setLoadingSurvey(true);
        const surveyData = await getSurvey(BigInt(surveyId));
        if (surveyData) {
          setSurvey(surveyData);
          setAnswers(
            surveyData.questions.map(() => {
              if (surveyData.questionTypes[surveyData.questions.indexOf(surveyData.questions[surveyData.questions.length - 1])] === 3) {
                return [];
              }
              return [];
            })
          );
        }
      } catch (err) {
        console.error("Failed to load survey:", err);
      } finally {
        setLoadingSurvey(false);
      }
    };

    loadSurvey();
  }, [surveyId, isConnected, getSurvey]);

  const handleAnswerChange = (
    questionIndex: number,
    optionIndex: number,
    checked: boolean
  ) => {
    const updated = [...answers];
    if (!updated[questionIndex]) {
      updated[questionIndex] = [];
    }

    const questionType = survey?.questionTypes[questionIndex];
    if (questionType === 0 || questionType === 2) {
      updated[questionIndex] = checked ? [optionIndex] : [];
    } else if (questionType === 1) {
      if (checked) {
        if (!updated[questionIndex].includes(optionIndex)) {
          updated[questionIndex] = [...updated[questionIndex], optionIndex];
        }
      } else {
        updated[questionIndex] = updated[questionIndex].filter(
          (i) => i !== optionIndex
        );
      }
    }
    setAnswers(updated);
  };

  const handleNumericAnswer = (questionIndex: number, value: number) => {
    const updated = [...answers];
    updated[questionIndex] = [value];
    setAnswers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !submitAnswer || !survey) {
      return;
    }

    for (let i = 0; i < survey.questions.length; i++) {
      if (!answers[i] || answers[i].length === 0) {
        alert(`Please answer question ${i + 1}`);
        return;
      }
    }

    try {
      const encryptedIncrements: string[][] = [];

      for (let qIdx = 0; qIdx < survey.questions.length; qIdx++) {
        const questionType = survey.questionTypes[qIdx];
        const optionCount = survey.optionCounts[qIdx];
        const questionAnswers = answers[qIdx];

        const increments: string[] = [];

        if (questionType === 0 || questionType === 2) {
          for (let optIdx = 0; optIdx < optionCount; optIdx++) {
            increments.push(questionAnswers[0] === optIdx ? "1" : "0");
          }
        } else if (questionType === 1) {
          for (let optIdx = 0; optIdx < optionCount; optIdx++) {
            increments.push(questionAnswers.includes(optIdx) ? "1" : "0");
          }
        } else if (questionType === 3) {
          increments.push(questionAnswers[0].toString());
          increments.push("1");
        }

        encryptedIncrements.push(increments);
      }

      await submitAnswer(BigInt(surveyId), encryptedIncrements);
      setHasAnswered(true);
      router.push("/my-answers");
    } catch (err) {
      console.error("Failed to submit answer:", err);
    }
  };

  if (!isConnected) {
    return (
      <div className="glass rounded-2xl p-12 text-center shadow-lg">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-muted-foreground text-lg">
          Please connect your wallet to answer this survey
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

  if (hasAnswered) {
    return (
      <div className="glass rounded-2xl p-12 text-center shadow-lg">
        <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-muted-foreground text-lg mb-4">
          You have already answered this survey
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="glass rounded-2xl p-8 shadow-lg border-l-4 border-l-primary">
        <h2 className="text-3xl font-bold mb-4 gradient-text">{survey.title}</h2>
        {survey.description && (
          <p className="text-muted-foreground mb-6 text-lg">{survey.description}</p>
        )}
        <div className="flex items-center gap-2 text-sm">
          <span className="px-3 py-1 bg-accent rounded-full text-muted-foreground font-medium">
            {survey.creator.slice(0, 6)}...{survey.creator.slice(-4)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {survey.questions.map((question, qIndex) => {
          const questionType = survey.questionTypes[qIndex];
          const optionCount = survey.optionCounts[qIndex];

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
                <div className="space-y-3">
                  {Array.from({ length: optionCount }).map((_, optIndex) => (
                    <label
                      key={optIndex}
                      className="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer hover:bg-accent hover:border-primary/50 transition-all group"
                    >
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        checked={answers[qIndex]?.[0] === optIndex}
                        onChange={(e) =>
                          handleAnswerChange(qIndex, optIndex, e.target.checked)
                        }
                        className="w-5 h-5 text-primary focus:ring-2 focus:ring-primary"
                      />
                      <span className="flex-1 font-medium group-hover:text-primary transition-colors">Option {optIndex + 1}</span>
                    </label>
                  ))}
                </div>
              )}

              {questionType === 1 && (
                <div className="space-y-3">
                  {Array.from({ length: optionCount }).map((_, optIndex) => (
                    <label
                      key={optIndex}
                      className="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer hover:bg-accent hover:border-primary/50 transition-all group"
                    >
                      <input
                        type="checkbox"
                        checked={answers[qIndex]?.includes(optIndex) || false}
                        onChange={(e) =>
                          handleAnswerChange(qIndex, optIndex, e.target.checked)
                        }
                        className="w-5 h-5 text-primary focus:ring-2 focus:ring-primary rounded"
                      />
                      <span className="flex-1 font-medium group-hover:text-primary transition-colors">Option {optIndex + 1}</span>
                    </label>
                  ))}
                </div>
              )}

              {questionType === 2 && (
                <div className="space-y-3">
                  {Array.from({ length: optionCount }).map((_, optIndex) => (
                    <label
                      key={optIndex}
                      className="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer hover:bg-accent hover:border-primary/50 transition-all group"
                    >
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        checked={answers[qIndex]?.[0] === optIndex}
                        onChange={(e) =>
                          handleAnswerChange(qIndex, optIndex, e.target.checked)
                        }
                        className="w-5 h-5 text-primary focus:ring-2 focus:ring-primary"
                      />
                      <span className="flex-1 font-medium group-hover:text-primary transition-colors flex items-center gap-2">
                        <span className="text-2xl">⭐</span>
                        {optIndex + 1} star{optIndex !== 0 ? "s" : ""}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {questionType === 3 && (
                <div>
                  <input
                    type="number"
                    value={answers[qIndex]?.[0] || ""}
                    onChange={(e) =>
                      handleNumericAnswer(qIndex, Number(e.target.value))
                    }
                    className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background text-lg"
                    placeholder="Enter a number"
                  />
                </div>
              )}
            </div>
          );
        })}

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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
              Submitting...
            </span>
          ) : (
            "Submit Answers"
          )}
        </button>
      </form>
    </div>
  );
}
