"use client";

import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { SurveySealAddresses } from "@/abi/SurveySealAddresses";
import { SurveySealABI } from "@/abi/SurveySealABI";

type SurveySealInfoType = {
  abi: typeof SurveySealABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getSurveySealByChainId(
  chainId: number | undefined
): SurveySealInfoType {
  if (!chainId) {
    return { abi: SurveySealABI.abi };
  }

  const entry =
    SurveySealAddresses[chainId.toString() as keyof typeof SurveySealAddresses];

  if (!entry || !("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: SurveySealABI.abi, chainId };
  }

  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: SurveySealABI.abi,
  };
}

export const useSurveySeal = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<string>("");

  const surveySealRef = useRef<SurveySealInfoType | undefined>(undefined);

  const surveySeal = useMemo(() => {
    const c = getSurveySealByChainId(chainId);
    surveySealRef.current = c;
    if (!c.address) {
      setMessage(`SurveySeal deployment not found for chainId=${chainId}.`);
    }
    return c;
  }, [chainId]);

  const isDeployed = useMemo(() => {
    if (!surveySeal) {
      return undefined;
    }
    return (
      Boolean(surveySeal.address) && surveySeal.address !== ethers.ZeroAddress
    );
  }, [surveySeal]);

  const createSurvey = useCallback(
    async (
      title: string,
      description: string,
      questions: string[],
      questionTypes: number[],
      optionCounts: number[]
    ) => {
      if (
        isLoading ||
        !surveySeal.address ||
        !ethersSigner ||
        !instance ||
        !sameChain.current(chainId) ||
        !sameSigner.current(ethersSigner)
      ) {
        return;
      }

      setIsLoading(true);
      setError(undefined);
      setMessage("Creating survey...");

      try {
        const contract = new ethers.Contract(
          surveySeal.address,
          surveySeal.abi,
          ethersSigner
        );

        const tx = await contract.createSurvey(
          title,
          description,
          questions,
          questionTypes,
          optionCounts
        );

        setMessage(`Transaction submitted: ${tx.hash}`);

        const receipt = await tx.wait();

        if (!receipt) {
          throw new Error("Transaction receipt not found");
        }

        const surveyId = (await contract.getSurveyCount()) - BigInt(1);

        setMessage(`Survey created successfully! Survey ID: ${surveyId}`);

        return { surveyId: Number(surveyId), txHash: tx.hash };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        setMessage(`Failed to create survey: ${errorMessage}`);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [
      surveySeal.address,
      surveySeal.abi,
      ethersSigner,
      instance,
      chainId,
      isLoading,
      sameChain,
      sameSigner,
    ]
  );

  const submitAnswer = useCallback(
    async (surveyId: bigint, encryptedIncrements: string[][]) => {
      if (
        isLoading ||
        !surveySeal.address ||
        !ethersSigner ||
        !instance ||
        !sameChain.current(chainId) ||
        !sameSigner.current(ethersSigner)
      ) {
        return;
      }

      setIsLoading(true);
      setError(undefined);
      setMessage("Encrypting answers...");

      try {
        const contract = new ethers.Contract(
          surveySeal.address,
          surveySeal.abi,
          ethersSigner
        );

        const input = instance.createEncryptedInput(
          surveySeal.address,
          await ethersSigner.getAddress()
        );

        for (const questionIncrements of encryptedIncrements) {
          for (const increment of questionIncrements) {
            input.add32(Number.parseInt(increment, 10));
          }
        }

        const enc = await input.encrypt();

        const handles2D: string[][] = [];
        let handleIndex = 0;
        for (const questionIncrements of encryptedIncrements) {
          const questionHandles: string[] = [];
          for (let i = 0; i < questionIncrements.length; i++) {
            const handle = enc.handles[handleIndex++];
            questionHandles.push(ethers.hexlify(handle));
          }
          handles2D.push(questionHandles);
        }

        setMessage("Submitting answer...");

        const tx = await contract.submitAnswer(
          surveyId,
          handles2D,
          enc.inputProof
        );

        setMessage(`Transaction submitted: ${tx.hash}`);

        const receipt = await tx.wait();

        if (!receipt) {
          throw new Error("Transaction receipt not found");
        }

        setMessage("Answer submitted successfully!");

        return { txHash: tx.hash };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        setMessage(`Failed to submit answer: ${errorMessage}`);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [
      surveySeal.address,
      surveySeal.abi,
      ethersSigner,
      instance,
      chainId,
      isLoading,
      sameChain,
      sameSigner,
    ]
  );

  const getStatistics = useCallback(
    async (surveyId: bigint) => {
      if (
        !surveySeal.address ||
        !ethersReadonlyProvider ||
        !instance ||
        !ethersSigner
      ) {
        return undefined;
      }

      try {
        const contract = new ethers.Contract(
          surveySeal.address,
          surveySeal.abi,
          ethersReadonlyProvider
        );

        const encryptedStats = await contract.getStatistics(surveyId);

        if (!encryptedStats || encryptedStats.length === 0) {
          return undefined;
        }

        setMessage("Decrypting statistics...");

        const sig = await import("@/fhevm/FhevmDecryptionSignature").then(
          (m) => m.FhevmDecryptionSignature
        );

        const decryptionSig = await sig.loadOrSign(
          instance,
          [surveySeal.address],
          ethersSigner,
          fhevmDecryptionSignatureStorage
        );

        if (!decryptionSig) {
          throw new Error("Failed to get decryption signature");
        }

        const decryptedStats: bigint[][] = [];

        for (let qIdx = 0; qIdx < encryptedStats.length; qIdx++) {
          const questionStats: bigint[] = [];
          for (let optIdx = 0; optIdx < encryptedStats[qIdx].length; optIdx++) {
            const handle = encryptedStats[qIdx][optIdx];
            if (handle === ethers.ZeroHash) {
              questionStats.push(BigInt(0));
              continue;
            }

            const res = await instance.userDecrypt(
              [{ handle, contractAddress: surveySeal.address }],
              decryptionSig.privateKey,
              decryptionSig.publicKey,
              decryptionSig.signature,
              decryptionSig.contractAddresses,
              decryptionSig.userAddress,
              decryptionSig.startTimestamp,
              decryptionSig.durationDays
            );

            const decryptedValue = res[handle];
            questionStats.push(
              typeof decryptedValue === "bigint" ? decryptedValue : BigInt(0)
            );
          }
          decryptedStats.push(questionStats);
        }

        setMessage("Statistics decrypted successfully!");

        return decryptedStats;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        setMessage(`Failed to get statistics: ${errorMessage}`);
        return undefined;
      }
    },
    [
      surveySeal.address,
      surveySeal.abi,
      ethersReadonlyProvider,
      instance,
      ethersSigner,
      fhevmDecryptionSignatureStorage,
    ]
  );

  const getSurvey = useCallback(
    async (surveyId: bigint) => {
      if (!surveySeal.address || !ethersReadonlyProvider) {
        return undefined;
      }

      try {
        const contract = new ethers.Contract(
          surveySeal.address,
          surveySeal.abi,
          ethersReadonlyProvider
        );

        const survey = await contract.getSurvey(surveyId);

        return {
          creator: survey.creator,
          title: survey.title,
          description: survey.description,
          questions: survey.questions,
          questionTypes: survey.questionTypes.map((t: bigint) => Number(t)),
          optionCounts: survey.optionCounts.map((c: bigint) => Number(c)),
          createdAt: Number(survey.createdAt),
          isActive: survey.isActive,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return undefined;
      }
    },
    [surveySeal.address, surveySeal.abi, ethersReadonlyProvider]
  );

  const getAllSurveys = useCallback(
    async () => {
      if (!surveySeal.address || !ethersReadonlyProvider) {
        return [];
      }

      try {
        const contract = new ethers.Contract(
          surveySeal.address,
          surveySeal.abi,
          ethersReadonlyProvider
        );

        const count = await contract.getSurveyCount();
        const surveys: Array<{
          id: number;
          creator: string;
          title: string;
          description: string;
          createdAt: number;
          isActive: boolean;
        }> = [];

        for (let i = 0; i < Number(count); i++) {
          try {
            const survey = await contract.getSurvey(i);
            if (survey.isActive) {
              surveys.push({
                id: i,
                creator: survey.creator,
                title: survey.title,
                description: survey.description,
                createdAt: Number(survey.createdAt),
                isActive: survey.isActive,
              });
            }
          } catch {
            continue;
          }
        }

        return surveys;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return [];
      }
    },
    [surveySeal.address, surveySeal.abi, ethersReadonlyProvider]
  );

  const getMyAnsweredSurveys = useCallback(
    async (userAddress: string) => {
      if (!surveySeal.address || !ethersReadonlyProvider) {
        return [];
      }

      try {
        const contract = new ethers.Contract(
          surveySeal.address,
          surveySeal.abi,
          ethersReadonlyProvider
        );

        const count = await contract.getSurveyCount();
        const answeredSurveys: Array<{
          id: number;
          creator: string;
          title: string;
          description: string;
          createdAt: number;
        }> = [];

        for (let i = 0; i < Number(count); i++) {
          try {
            const hasAnswered = await contract.hasAnswered(i, userAddress);
            if (hasAnswered) {
              const survey = await contract.getSurvey(i);
              answeredSurveys.push({
                id: i,
                creator: survey.creator,
                title: survey.title,
                description: survey.description,
                createdAt: Number(survey.createdAt),
              });
            }
          } catch {
            continue;
          }
        }

        return answeredSurveys.sort((a, b) => b.createdAt - a.createdAt);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return [];
      }
    },
    [surveySeal.address, surveySeal.abi, ethersReadonlyProvider]
  );

  return {
    contractAddress: surveySeal.address,
    isDeployed,
    isLoading,
    error,
    message,
    createSurvey,
    submitAnswer,
    getStatistics,
    getSurvey,
    getAllSurveys,
    getMyAnsweredSurveys,
  };
};

