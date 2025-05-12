#include <iostream>
#include <string>
#include <limits>
using namespace std;

// Helper function to get and validate hand choice
int getValidHandChoiceInput(const string& prompt) {
    int choice;
    cout << prompt;
    cin >> choice;
    while (choice != 1 && choice != 2) {
        cout << "잘못된 선택입니다. 1 (왼손) 또는 2 (오른손)를 입력하세요: ";
        cin.clear(); // Clear error flags
        cin.ignore(numeric_limits<streamsize>::max(), '\n'); // Discard invalid input
        cin >> choice;
    }
    return choice;
}

//class와 그 안의 요소들 정의
class Player {
public:
    int leftHand;
    int rightHand;

    Player() : leftHand(1), rightHand(1) {}

    bool isDefeated() {
        return (leftHand == 0 && rightHand == 0);
    }

    void displayHands() {
        cout << "왼손: " << leftHand << ", 오른손: " << rightHand << endl;
    }

    bool splitHands(int newLeft, int newRight) {
        if ((newLeft + newRight) == (leftHand + rightHand) && newLeft >= 0 && newRight >= 0 && newLeft != rightHand && newRight != leftHand) {
            leftHand = newLeft;
            rightHand = newRight;
            return true;
        } else {
            cout << "잘못된 분할입니다. 다시 시도하세요." << endl;
            return false;
        }
    }
};

void attack(Player &attacker, Player &defender, bool useLeftHand, bool targetLeftHand) {
    int attackValue = useLeftHand ? attacker.leftHand : attacker.rightHand; 
    // if useLeftHand is true, attackValue is attacker's left hand, otherwise, it is attacker's right hand
    // if targetlefthand is valid, defender is attacked to the left hand
    if (targetLeftHand) {
        defender.leftHand = (defender.leftHand + attackValue) % 5;
    } else {
        defender.rightHand = (defender.rightHand + attackValue) % 5;
    }
}

int main() {
    Player player1, player2;
    bool player1Turn = true;
    int choice, target, newLeft, newRight;
    
    while (true) {
        if (player1.isDefeated()) {
            cout << "플레이어 2 승리!" << endl;
            break;
        } else if (player2.isDefeated()) {
            cout << "플레이어 1 승리!" << endl;
            break;
        }

        Player &currentPlayer = player1Turn ? player1 : player2;
        Player &opponentPlayer = player1Turn ? player2 : player1;

        cout << (player1Turn ? "플레이어 1" : "플레이어 2") << "의 차례입니다." << endl;
        cout << "현재 손 상태: " << endl;
        cout << "플레이어 1 - ";
        player1.displayHands();
        cout << "플레이어 2 - ";
        player2.displayHands();

        cout << "행동을 선택하세요: 1. 공격 2. 손가락 나누기 : ";
        cin >> choice;
        while (choice != 1 && choice != 2) {
            cout << "잘못된 선택입니다. 1 (공격) 또는 2 (손가락 나누기)를 입력하세요: ";
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cin >> choice;
        }

        if (choice == 1) {
            // 공격할 손을 선택하세요 (1: 왼손, 2: 오른손):
            int attackerHandChoice;
            while (true) {
                attackerHandChoice = getValidHandChoiceInput("공격할 손을 선택하세요 (1: 왼손, 2: 오른손): ");
                bool useLeftHand = (attackerHandChoice == 1);
                int attackerHandValue = useLeftHand ? currentPlayer.leftHand : currentPlayer.rightHand;
                if (attackerHandValue == 0) {
                    cout << "0인 손으로는 공격할 수 없습니다. 다른 손을 선택하세요." << endl;
                } else {
                    break;
                }
            }
            bool useLeftHand = (attackerHandChoice == 1);

            int defenderHandChoice;
            while (true) {
                defenderHandChoice = getValidHandChoiceInput("상대방의 어느 손을 공격할까요? (1: 왼손, 2: 오른손): ");
                bool targetLeftHand = (defenderHandChoice == 1);
                int defenderHandValue = targetLeftHand ? opponentPlayer.leftHand : opponentPlayer.rightHand;
                if (defenderHandValue == 0) {
                    cout << "상대방의 0인 손은 공격할 수 없습니다. 다른 손을 선택하세요." << endl;
                } else {
                    break;
                }
            }
            bool targetLeftHand = (defenderHandChoice == 1);

            attack(currentPlayer, opponentPlayer, useLeftHand, targetLeftHand);
        } else if (choice == 2) {
            bool validSplit = false;
            while (!validSplit) {
                cout << "새로운 왼손과 오른손의 값을 입력하세요: ";
                cin >> newLeft >> newRight;
                validSplit = currentPlayer.splitHands(newLeft, newRight);
            }
        } else {
            cout << "잘못된 선택입니다. 다시 시도하세요." << endl;
        }

        player1Turn = !player1Turn;
    }

    return 0;
}
