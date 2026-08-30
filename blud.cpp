#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

struct Question {
    std::string category; // e.g., "Math", "RW"
    std::string subtopic; // e.g., "Expression of Ideas", "Algebra"
    std::string text;
    std::vector<std::string> options;
    char correctAnswer;
    std::string explanation;
};

// Mock database simulating your pre-downloaded local questions
std::vector<Question> loadLocalDatabase() {
    return {
        {"RW", "Expression of Ideas", "Which choice completes the text so that it conforms to the conventions of Standard English?", {"A) option 1", "B) option 2", "C) option 3", "D) option 4"}, 'B', "Explanation: B is correct because..."},
        {"Math", "Algebra", "Solve for x: 2x + 4 = 10", {"A) 2", "B) 3", "C) 4", "D) 5"}, 'B', "Explanation: Subtract 4 to get 2x=6, so x=3."},
        {"RW", "Craft and Structure", "What is the main purpose of the text?", {"A) To argue", "B) To inform", "C) To entertain", "D) To describe"}, 'B', "Explanation: The text strictly presents factual information."}
    };
}

int main() {
    std::vector<Question> allQuestions = loadLocalDatabase();
    std::vector<Question> quizQueue;
    
    std::cout << "--- SAT Target Practice ---" << std::endl;
    std::cout << "Select Category (1: Math, 2: RW, 3: Both): ";
    int catChoice;
    std::cin >> catChoice;
    
    std::string targetCat = (catChoice == 1) ? "Math" : (catChoice == 2) ? "RW" : "Both";

    // Filter questions based on user input
    for (const auto& q : allQuestions) {
        if (targetCat == "Both" || q.category == targetCat) {
            quizQueue.push_back(q);
        }
    }

    if (quizQueue.empty()) {
        std::cout << "No questions found for this configuration.\n";
        return 0;
    }

    int currentIndex = 0;
    int totalQuestions = quizQueue.size();
    bool running = true;

    while (running && currentIndex < totalQuestions) {
        Question currentQ = quizQueue[currentIndex];
        
        std::cout << "\n====================================\n";
        std::cout << "Question " << (currentIndex + 1) << " of " << totalQuestions << " [" << currentQ.category << " - " << currentQ.subtopic << "]\n\n";
        std::cout << currentQ.text << "\n\n";
        
        for (const auto& opt : currentQ.options) {
            std::cout << opt << "\n";
        }
        
        std::cout << "\nEnter answer (A/B/C/D), 'N' for next, 'P' for previous, or 'Q' to quit: ";
        char input;
        std::cin >> input;
        input = toupper(input);

        if (input == 'Q') {
            running = false;
        } else if (input == 'N') {
            if (currentIndex < totalQuestions - 1) currentIndex++;
            else std::cout << "You are at the last question.\n";
        } else if (input == 'P') {
            if (currentIndex > 0) currentIndex--;
            else std::cout << "You are at the first question.\n";
        } else if (input == 'A' || input == 'B' || input == 'C' || input == 'D') {
            if (input == currentQ.correctAnswer) {
                std::cout << "\n✅ CORRECT!\n";
            } else {
                std::cout << "\n❌ INCORRECT. The correct answer was " << currentQ.correctAnswer << ".\n";
            }
            std::cout << "\nExplanation:\n" << currentQ.explanation << "\n";
            
            std::cout << "\nPress Enter to continue...";
            std::cin.ignore();
            std::cin.get();
            
            if (currentIndex < totalQuestions - 1) currentIndex++;
            else running = false;
        } else {
            std::cout << "Invalid input. Try again.\n";
        }
    }

    std::cout << "\nQuiz Complete. Good luck!\n";
    return 0;
}