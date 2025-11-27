import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { SurveySeal, SurveySeal__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  creator: HardhatEthersSigner;
  respondent: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("SurveySeal")) as SurveySeal__factory;
  const surveySealContract = (await factory.deploy()) as SurveySeal;
  const surveySealContractAddress = await surveySealContract.getAddress();

  return { surveySealContract, surveySealContractAddress };
}

describe("SurveySeal", function () {
  let signers: Signers;
  let surveySealContract: SurveySeal;
  let surveySealContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      creator: ethSigners[1],
      respondent: ethSigners[2],
    };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ surveySealContract, surveySealContractAddress } = await deployFixture());
  });

  describe("createSurvey", function () {
    it("should create a survey with single choice question", async function () {
      const title = "Test Survey";
      const description = "A test survey";
      const questions = ["What is your favorite color?"];
      const questionTypes = [0]; // SingleChoice
      const optionCounts = [3]; // 3 options

      const tx = await surveySealContract
        .connect(signers.creator)
        .createSurvey(title, description, questions, questionTypes, optionCounts);
      const receipt = await tx.wait();

      expect(receipt).to.not.be.null;

      const survey = await surveySealContract.getSurvey(0);
      expect(survey.creator).to.eq(signers.creator.address);
      expect(survey.title).to.eq(title);
      expect(survey.description).to.eq(description);
      expect(survey.questions.length).to.eq(1);
      expect(survey.questionTypes[0]).to.eq(0);
      expect(survey.optionCounts[0]).to.eq(3);
      expect(survey.isActive).to.be.true;
    });

    it("should create a survey with multiple questions", async function () {
      const title = "Multi Question Survey";
      const description = "Survey with multiple questions";
      const questions = [
        "What is your favorite color?",
        "Rate your satisfaction (1-5)",
      ];
      const questionTypes = [0, 2]; // SingleChoice, Rating
      const optionCounts = [3, 5]; // 3 options, 5 rating levels

      const tx = await surveySealContract
        .connect(signers.creator)
        .createSurvey(title, description, questions, questionTypes, optionCounts);
      await tx.wait();

      const survey = await surveySealContract.getSurvey(0);
      expect(survey.questions.length).to.eq(2);
      expect(survey.questionTypes[0]).to.eq(0);
      expect(survey.questionTypes[1]).to.eq(2);
    });

    it("should fail with empty questions", async function () {
      const title = "Empty Survey";
      const description = "No questions";
      const questions: string[] = [];
      const questionTypes: number[] = [];
      const optionCounts: number[] = [];

      await expect(
        surveySealContract
          .connect(signers.creator)
          .createSurvey(title, description, questions, questionTypes, optionCounts)
      ).to.be.revertedWith("Survey must have at least one question");
    });

    it("should fail with invalid option count for single choice", async function () {
      const title = "Invalid Survey";
      const description = "Invalid option count";
      const questions = ["Question?"];
      const questionTypes = [0]; // SingleChoice
      const optionCounts = [1]; // Only 1 option (invalid)

      await expect(
        surveySealContract
          .connect(signers.creator)
          .createSurvey(title, description, questions, questionTypes, optionCounts)
      ).to.be.revertedWith("Choice questions must have at least 2 options");
    });

    it("should fail with invalid rating range", async function () {
      const title = "Invalid Rating";
      const description = "Invalid rating range";
      const questions = ["Rate?"];
      const questionTypes = [2]; // Rating
      const optionCounts = [11]; // 11 options (invalid, max is 10)

      await expect(
        surveySealContract
          .connect(signers.creator)
          .createSurvey(title, description, questions, questionTypes, optionCounts)
      ).to.be.revertedWith("Rating must be between 2 and 10");
    });

    it("should fail with invalid numeric input option count", async function () {
      const title = "Invalid Numeric";
      const description = "Invalid numeric option count";
      const questions = ["Enter a number"];
      const questionTypes = [3]; // NumericInput
      const optionCounts = [1]; // Should be 2

      await expect(
        surveySealContract
          .connect(signers.creator)
          .createSurvey(title, description, questions, questionTypes, optionCounts)
      ).to.be.revertedWith("NumericInput must have optionCount of 2");
    });
  });

  describe("submitAnswer", function () {
    let surveyId: bigint;

    beforeEach(async function () {
      // Create a survey with one single choice question
      const title = "Test Survey";
      const description = "A test survey";
      const questions = ["What is your favorite color?"];
      const questionTypes = [0]; // SingleChoice
      const optionCounts = [3]; // 3 options

      const tx = await surveySealContract
        .connect(signers.creator)
        .createSurvey(title, description, questions, questionTypes, optionCounts);
      await tx.wait();

      surveyId = 0n;
    });

    it("should submit answer for single choice question", async function () {
      // Encrypt increments: [1, 0, 0] (selected option 0)
      const selectedOption = 0;
      const optionCount = 3;

      const input = fhevm.createEncryptedInput(
        surveySealContractAddress,
        signers.respondent.address
      );

      // Add increments for each option
      for (let i = 0; i < optionCount; i++) {
        const value = i === selectedOption ? 1 : 0;
        input.add32(value);
      }

      const enc = await input.encrypt();

      // Prepare 2D array: [questionIndex][optionIndex]
      const encryptedIncrements: string[][] = [[enc.handles[0], enc.handles[1], enc.handles[2]]];

      const tx = await surveySealContract
        .connect(signers.respondent)
        .submitAnswer(surveyId, encryptedIncrements, enc.inputProof);
      await tx.wait();

      // Check that user has answered
      const hasAnswered = await surveySealContract.hasAnswered(surveyId, signers.respondent.address);
      expect(hasAnswered).to.be.true;
    });

    it("should fail if already answered", async function () {
      // Submit first answer
      const selectedOption = 0;
      const optionCount = 3;

      const input = fhevm.createEncryptedInput(
        surveySealContractAddress,
        signers.respondent.address
      );

      for (let i = 0; i < optionCount; i++) {
        const value = i === selectedOption ? 1 : 0;
        input.add32(value);
      }

      const enc = await input.encrypt();
      const encryptedIncrements: string[][] = [[enc.handles[0], enc.handles[1], enc.handles[2]]];

      let tx = await surveySealContract
        .connect(signers.respondent)
        .submitAnswer(surveyId, encryptedIncrements, enc.inputProof);
      await tx.wait();

      // Try to submit again
      await expect(
        surveySealContract
          .connect(signers.respondent)
          .submitAnswer(surveyId, encryptedIncrements, enc.inputProof)
      ).to.be.revertedWith("Already answered this survey");
    });

    it("should fail with wrong answer count", async function () {
      const optionCount = 3;
      const input = fhevm.createEncryptedInput(
        surveySealContractAddress,
        signers.respondent.address
      );

      // Only add 2 values instead of 3
      input.add32(1);
      input.add32(0);

      const enc = await input.encrypt();
      const encryptedIncrements: string[][] = [[enc.handles[0], enc.handles[1]]];

      await expect(
        surveySealContract
          .connect(signers.respondent)
          .submitAnswer(surveyId, encryptedIncrements, enc.inputProof)
      ).to.be.revertedWith("Increment array length must match option count");
    });
  });

  describe("getStatistics", function () {
    let surveyId: bigint;

    beforeEach(async function () {
      // Create a survey
      const title = "Test Survey";
      const description = "A test survey";
      const questions = ["What is your favorite color?"];
      const questionTypes = [0]; // SingleChoice
      const optionCounts = [3]; // 3 options

      const tx = await surveySealContract
        .connect(signers.creator)
        .createSurvey(title, description, questions, questionTypes, optionCounts);
      await tx.wait();

      surveyId = 0n;
    });

    it("should return encrypted statistics", async function () {
      // Submit an answer first
      const selectedOption = 0;
      const optionCount = 3;

      const input = fhevm.createEncryptedInput(
        surveySealContractAddress,
        signers.respondent.address
      );

      for (let i = 0; i < optionCount; i++) {
        const value = i === selectedOption ? 1 : 0;
        input.add32(value);
      }

      const enc = await input.encrypt();
      const encryptedIncrements: string[][] = [[enc.handles[0], enc.handles[1], enc.handles[2]]];

      let tx = await surveySealContract
        .connect(signers.respondent)
        .submitAnswer(surveyId, encryptedIncrements, enc.inputProof);
      await tx.wait();

      // Get statistics using static call (since getStatistics is not view)
      const stats = await surveySealContract
        .connect(signers.creator)
        .getStatistics.staticCall(surveyId);

      expect(stats).to.not.be.undefined;
      expect(Array.isArray(stats)).to.be.true;
      expect(stats.length).to.eq(1); // One question
      expect(stats[0]).to.not.be.undefined;
      expect(Array.isArray(stats[0])).to.be.true;
      expect(stats[0].length).to.eq(3); // Three options

      // Check that stats are not zero hash (uninitialized)
      for (let i = 0; i < stats[0].length; i++) {
        expect(stats[0][i]).to.not.eq(ethers.ZeroHash);
      }

      // Decrypt statistics
      const decryptedStats: bigint[] = [];
      for (let i = 0; i < stats[0].length; i++) {
        try {
          const clearValue = await fhevm.userDecryptEuint(
            FhevmType.euint32,
            stats[0][i],
            surveySealContractAddress,
            signers.creator
          );
          decryptedStats.push(clearValue);
        } catch (error) {
          console.error(`Failed to decrypt stats[0][${i}]:`, error);
          // If decryption fails, the value might be 0 (uninitialized)
          decryptedStats.push(0n);
        }
      }

      // Option 0 should have count 1, others should be 0
      expect(decryptedStats[0]).to.eq(1n);
      expect(decryptedStats[1]).to.eq(0n);
      expect(decryptedStats[2]).to.eq(0n);
    });

    it("should fail if not creator", async function () {
      await expect(
        surveySealContract.connect(signers.respondent).getStatistics(surveyId)
      ).to.be.revertedWith("Only creator can view statistics");
    });
  });

  describe("getSurveyCount", function () {
    it("should return correct survey count", async function () {
      expect(await surveySealContract.getSurveyCount()).to.eq(0n);

      // Create first survey
      const title1 = "Survey 1";
      const description1 = "First survey";
      const questions1 = ["Question 1?"];
      const questionTypes1 = [0];
      const optionCounts1 = [2];

      let tx = await surveySealContract
        .connect(signers.creator)
        .createSurvey(title1, description1, questions1, questionTypes1, optionCounts1);
      await tx.wait();

      expect(await surveySealContract.getSurveyCount()).to.eq(1n);

      // Create second survey
      const title2 = "Survey 2";
      const description2 = "Second survey";
      const questions2 = ["Question 2?"];
      const questionTypes2 = [0];
      const optionCounts2 = [2];

      tx = await surveySealContract
        .connect(signers.creator)
        .createSurvey(title2, description2, questions2, questionTypes2, optionCounts2);
      await tx.wait();

      expect(await surveySealContract.getSurveyCount()).to.eq(2n);
    });
  });
});

