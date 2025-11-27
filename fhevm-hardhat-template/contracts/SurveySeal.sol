// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract SurveySeal is ZamaEthereumConfig {
    enum QuestionType {
        SingleChoice,
        MultipleChoice,
        Rating,
        NumericInput
    }

    struct Survey {
        address creator;
        string title;
        string description;
        string[] questions;
        QuestionType[] questionTypes;
        uint256[] optionCounts;
        uint256 createdAt;
        bool isActive;
    }

    mapping(uint256 => Survey) public surveys;
    mapping(uint256 => mapping(uint256 => euint32[])) public statistics;
    mapping(uint256 => mapping(address => bool)) public hasAnswered;
    uint256 public surveyCount;

    event SurveyCreated(
        uint256 indexed surveyId,
        address indexed creator,
        string title,
        uint256 questionCount
    );

    event AnswerSubmitted(
        uint256 indexed surveyId,
        address indexed respondent,
        uint256 questionCount
    );

    function createSurvey(
        string memory title,
        string memory description,
        string[] memory questions,
        QuestionType[] memory questionTypes,
        uint256[] memory optionCounts
    ) external returns (uint256 surveyId) {
        require(questions.length > 0, "Survey must have at least one question");
        require(
            questions.length == questionTypes.length,
            "Questions and questionTypes length mismatch"
        );
        require(
            questions.length == optionCounts.length,
            "Questions and optionCounts length mismatch"
        );

        for (uint256 i = 0; i < questions.length; i++) {
            if (
                questionTypes[i] == QuestionType.SingleChoice ||
                questionTypes[i] == QuestionType.MultipleChoice
            ) {
                require(optionCounts[i] >= 2, "Choice questions must have at least 2 options");
            } else if (questionTypes[i] == QuestionType.Rating) {
                require(optionCounts[i] >= 2 && optionCounts[i] <= 10, "Rating must be between 2 and 10");
            } else if (questionTypes[i] == QuestionType.NumericInput) {
                require(optionCounts[i] == 2, "NumericInput must have optionCount of 2");
            }
        }

        surveyId = surveyCount++;
        
        surveys[surveyId] = Survey({
            creator: msg.sender,
            title: title,
            description: description,
            questions: questions,
            questionTypes: questionTypes,
            optionCounts: optionCounts,
            createdAt: block.timestamp,
            isActive: true
        });

        for (uint256 i = 0; i < questions.length; i++) {
            statistics[surveyId][i] = new euint32[](optionCounts[i]);
        }

        emit SurveyCreated(surveyId, msg.sender, title, questions.length);
    }

    function submitAnswer(
        uint256 surveyId,
        externalEuint32[][] calldata encryptedIncrements,
        bytes calldata inputProof
    ) external {
        Survey storage survey = surveys[surveyId];
        require(survey.creator != address(0), "Survey does not exist");
        require(survey.isActive, "Survey is not active");
        require(!hasAnswered[surveyId][msg.sender], "Already answered this survey");
        require(
            encryptedIncrements.length == survey.questions.length,
            "Increment count must match question count"
        );

        for (uint256 qIdx = 0; qIdx < survey.questions.length; qIdx++) {
            uint256 optionCount = survey.optionCounts[qIdx];
            require(
                encryptedIncrements[qIdx].length == optionCount,
                "Increment array length must match option count"
            );

            if (statistics[surveyId][qIdx].length == 0) {
                statistics[surveyId][qIdx] = new euint32[](optionCount);
            }

            for (uint256 optIdx = 0; optIdx < optionCount; optIdx++) {
                euint32 increment = FHE.fromExternal(encryptedIncrements[qIdx][optIdx], inputProof);
                
                statistics[surveyId][qIdx][optIdx] = FHE.add(
                    statistics[surveyId][qIdx][optIdx],
                    increment
                );
                
                FHE.allowThis(statistics[surveyId][qIdx][optIdx]);
                FHE.allow(statistics[surveyId][qIdx][optIdx], survey.creator);
            }
        }

        hasAnswered[surveyId][msg.sender] = true;

        emit AnswerSubmitted(surveyId, msg.sender, survey.questions.length);
    }

    function getSurvey(uint256 surveyId) external view returns (Survey memory) {
        return surveys[surveyId];
    }

    function getStatistics(
        uint256 surveyId
    ) external view returns (euint32[][] memory) {
        Survey storage survey = surveys[surveyId];
        require(survey.creator != address(0), "Survey does not exist");
        require(msg.sender == survey.creator, "Only creator can view statistics");

        uint256 questionCount = survey.questions.length;
        euint32[][] memory stats = new euint32[][](questionCount);

        for (uint256 i = 0; i < questionCount; i++) {
            stats[i] = statistics[surveyId][i];
        }

        return stats;
    }

    function getSurveyCount() external view returns (uint256) {
        return surveyCount;
    }
}

