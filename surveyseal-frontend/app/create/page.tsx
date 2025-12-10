"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useFhevm } from "@/fhevm/useFhevm";
import { useSurveySeal } from "@/hooks/useSurveySeal";
import { useRouter } from "next/navigation";

type QuestionType = "SingleChoice" | "MultipleChoice" | "Rating" | "NumericInput";

interface Question {
  text: string;
  type: QuestionType;
  options: string[];
  ratingMax?: number;
  numericMin?: number;
  numericMax?: number;
}

export default function CreateSurveyPage() {
  const router = useRouter();
  const { isConnected, ethersSigner, ethersReadonlyProvider, provider, chainId, sameChain, sameSigner } = useMetaMaskEthersSigner();
  const { storage } = useInMemoryStorage();
  const { instance } = useFhevm();
  const { createSurvey, isLoading, error, message } = useSurveySeal({
    instance,
    fhevmDecryptionSignatureStorage: storage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { text: "", type: "SingleChoice", options: ["", ""] },
  ]);

  const addQuestion = () => {
    setQuestions([...questions, { text: "", type: "SingleChoice", options: ["", ""] }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: unknown) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options.push("");
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options = updated[questionIndex].options.filter(
      (_, i) => i !== optionIndex
    );
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !createSurvey) {
      return;
    }

    if (!title.trim()) {
      alert("Please enter a survey title");
      return;
    }

    if (questions.length === 0) {
      alert("Please add at least one question");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        alert(`Question ${i + 1} text is required`);
        return;
      }

      if (
        (q.type === "SingleChoice" || q.type === "MultipleChoice") &&
        q.options.filter((opt) => opt.trim()).length < 2
      ) {
        alert(`Question ${i + 1} must have at least 2 options`);
        return;
      }
    }

    try {
      const questionTexts = questions.map((q) => q.text);
      const questionTypes = questions.map((q) => {
        if (q.type === "SingleChoice") return 0;
        if (q.type === "MultipleChoice") return 1;
        if (q.type === "Rating") return 2;
        return 3;
      });
      const optionCounts = questions.map((q) => {
        if (q.type === "SingleChoice" || q.type === "MultipleChoice") {
          return q.options.filter((opt) => opt.trim()).length;
        }
        if (q.type === "Rating") {
          return q.ratingMax || 5;
        }
        return 2;
      });

      const result = await createSurvey(
        title,
        description,
        questionTexts,
        questionTypes,
        optionCounts
      );

      if (result) {
        router.push(`/survey/${result.surveyId}`);
      }
    } catch (err) {
      console.error("Failed to create survey:", err);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="glass rounded-2xl p-12 text-center shadow-lg">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-muted-foreground text-lg">
                Please connect your wallet to create a survey
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3 gradient-text">Create Survey</h1>
            <p className="text-muted-foreground">
              Design your encrypted survey with multiple question types
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="glass rounded-2xl p-8 shadow-lg space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-3 text-foreground">
                  Survey Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background"
                  placeholder="Enter survey title"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3 text-foreground">
                  Description <span className="text-muted-foreground">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background resize-none"
                  placeholder="Describe your survey"
                  maxLength={500}
                  rows={4}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Questions</h2>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Question
                </button>
              </div>

              {questions.map((question, qIndex) => (
                <div key={qIndex} className="glass rounded-2xl p-6 shadow-lg space-y-5 border-l-4 border-l-primary">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-primary font-bold">{qIndex + 1}</span>
                      </div>
                      <h3 className="text-lg font-bold">Question {qIndex + 1}</h3>
                    </div>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3 text-foreground">
                      Question Text <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={question.text}
                      onChange={(e) =>
                        updateQuestion(qIndex, "text", e.target.value)
                      }
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background"
                      placeholder="Enter question text"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3 text-foreground">
                      Question Type <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={question.type}
                      onChange={(e) =>
                        updateQuestion(qIndex, "type", e.target.value as QuestionType)
                      }
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background"
                    >
                      <option value="SingleChoice">Single Choice</option>
                      <option value="MultipleChoice">Multiple Choice</option>
                      <option value="Rating">Rating</option>
                      <option value="NumericInput">Numeric Input</option>
                    </select>
                  </div>

                  {(question.type === "SingleChoice" ||
                    question.type === "MultipleChoice") && (
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-foreground">
                        Options <span className="text-destructive">*</span>
                      </label>
                      <div className="space-y-3">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex gap-3 items-center">
                            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-muted-foreground">{optIndex + 1}</span>
                            </div>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) =>
                                updateOption(qIndex, optIndex, e.target.value)
                              }
                              className="flex-1 px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background"
                              placeholder={`Option ${optIndex + 1}`}
                            />
                            {question.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(qIndex, optIndex)}
                                className="px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => addOption(qIndex)}
                        className="mt-3 px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Option
                      </button>
                    </div>
                  )}

                  {question.type === "Rating" && (
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-foreground">
                        Maximum Rating
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="10"
                        value={question.ratingMax || 5}
                        onChange={(e) =>
                          updateQuestion(qIndex, "ratingMax", Number(e.target.value))
                        }
                        className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background"
                      />
                    </div>
                  )}

                  {question.type === "NumericInput" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-3 text-foreground">
                          Min Value
                        </label>
                        <input
                          type="number"
                          value={question.numericMin || 0}
                          onChange={(e) =>
                            updateQuestion(qIndex, "numericMin", Number(e.target.value))
                          }
                          className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-3 text-foreground">
                          Max Value
                        </label>
                        <input
                          type="number"
                          value={question.numericMax || 100}
                          onChange={(e) =>
                            updateQuestion(qIndex, "numericMax", Number(e.target.value))
                          }
                          className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                  Creating...
                </span>
              ) : (
                "Create Survey"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
