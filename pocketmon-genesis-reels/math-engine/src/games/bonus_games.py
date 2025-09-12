from typing import Dict, List

class BonusGame:
    def __init__(self, name: str, description: str, rewards: Dict[str, float]):
        self.name = name
        self.description = description
        self.rewards = rewards

    def trigger_bonus(self) -> str:
        return f"{self.name} bonus game triggered! {self.description}"

    def calculate_reward(self, multiplier: float) -> float:
        total_reward = sum(reward * multiplier for reward in self.rewards.values())
        return total_reward

class BonusGameManager:
    def __init__(self):
        self.bonus_games: List[BonusGame] = []

    def add_bonus_game(self, bonus_game: BonusGame):
        self.bonus_games.append(bonus_game)

    def trigger_random_bonus(self) -> str:
        import random
        if not self.bonus_games:
            return "No bonus games available."
        selected_game = random.choice(self.bonus_games)
        return selected_game.trigger_bonus()