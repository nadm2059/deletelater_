#include "nlohmann/json.hpp"
#include <iostream>
#include <string>
#include <fstream>


using json = nlohmann::json;
using namespace std;

int main(int argc, char* argv[]) {
    if (argc != 3) {
        cerr << "Invalid arguments." << endl;
        return 1;
    }

    string question = argv[1];
    string user_answer = argv[2];

    ifstream file("questions.json");
    json questions;
    file >> questions;

    for (auto& q : questions) {
        if (q["question"] == question) {
            string correct_answer = q["answer"];
            if (correct_answer == user_answer) {
                cout << "CORRECT" << endl;
            } else {
                cout << "WRONG" << endl;
            }
            return 0;
        }
    }
    cout << "WRONG" << endl;
    return 0;
}
