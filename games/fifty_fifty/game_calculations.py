"""Hybrid calculations: evolution chain (EG), Poké Hunt (PB), Battle Arena (TR)."""

from src.executables.executables import Executables
from src.calculations.statistics import get_random_outcome


class GameCalculations(Executables):
    """Custom mechanics built on core Executables."""

    # ---- Helpers ----
    def count_symbol_on_board(self, name: str) -> int:
        count = 0
        for r in range(self.config.num_reels):
            for c in range(self.config.num_rows[r]):
                if self.board[r][c].name == name:
                    count += 1
        return count

    # ---- Evolution (Egg adjacent to any win) ----
    def has_egg_adjacent_to_wins(self) -> bool:
        if not self.win_data or "wins" not in self.win_data:
            return False
        win_positions = set()
        for w in self.win_data["wins"]:
            for p in w.get("positions", []):
                win_positions.add((p["reel"], p["row"]))
        for r in range(self.config.num_reels):
            for c in range(self.config.num_rows[r]):
                if self.board[r][c].name == "EG":
                    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                        nr, nc = r + dr, c + dc
                        if 0 <= nr < self.config.num_reels and 0 <= nc < self.config.num_rows[nr]:
                            if (nr, nc) in win_positions:
                                return True
        return False

    def perform_evolution_step(self) -> bool:
        t1 = self.config.evolution_tiers["tier1"]
        t2 = self.config.evolution_tiers["tier2"]
        t1_to_t2 = self.config.evolution_map["tier1_to_tier2"]
        t2_to_t3 = self.config.evolution_map["tier2_to_tier3"]

        counts = {}
        for r in range(self.config.num_reels):
            for c in range(self.config.num_rows[r]):
                nm = self.board[r][c].name
                if nm in t1 or nm in t2:
                    counts[nm] = counts.get(nm, 0) + 1

        target = None
        target_map = None
        for s in t1:
            if counts.get(s, 0) >= 4:
                target = s
                target_map = t1_to_t2
                break
        if target is None:
            for s in t2:
                if counts.get(s, 0) >= 4:
                    target = s
                    target_map = t2_to_t3
                    break

        if target is None or target not in (target_map or {}):
            return False

        evolved_to = target_map[target]
        to_change = 4
        for r in range(self.config.num_reels):
            for c in range(self.config.num_rows[r]):
                if self.board[r][c].name == target and to_change > 0:
                    self.board[r][c] = self.create_symbol(evolved_to)
                    to_change -= 1
        return True

    def perform_evolution_chain(self, max_steps: int = 3):
        steps = 0
        while steps < max_steps and self.perform_evolution_step():
            steps += 1
            self.global_multiplier += 1

    # ---- Poké Hunt (PB scatter trigger) ----
    def run_pokehunt(self, throws: int):
        self.repeat = False
        self.win_manager.reset_spin_win()
        total = 0.0
        combo_mult = 1
        max_combo = 5
        last_ball = None

        balls = {
            "poke": (10, 50),
            "great": (25, 30),
            "ultra": (50, 15),
            "master": (100, 5),
        }

        for _ in range(throws):
            chosen = get_random_outcome({k: v[1] for k, v in balls.items()})
            base = balls[chosen][0]
            combo_mult = min(combo_mult + 1, max_combo) if last_ball == chosen else 1
            last_ball = chosen
            total += base * combo_mult
            if chosen == "master":
                break

        if total > 0:
            self.win_manager.update_spinwin(total)
            self.win_manager.update_gametype_wins(self.gametype)

    # ---- Battle Arena (TR scatter trigger) ----
    def run_battle_arena(self, gym: str, turns: int = 10):
        self.repeat = False
        self.win_manager.reset_spin_win()
        total_damage = 0.0
        gym_hp = {"Brock": 500, "Misty": 750, "LtSurge": 1000}
        hp = gym_hp[gym]

        moves = {
            "attack": (5, 60),
            "power": (20, 25),
            "special": ("x3_next_two", 10),
            "potion": ("+2_turns", 5),
        }

        pending_mult = 1
        buff_turns = 0
        t = 0
        max_turns = 50

        while t < turns and t < max_turns and hp > 0:
            roll = get_random_outcome({k: v[1] for k, v in moves.items()})
            effect = moves[roll][0]

            if effect == "x3_next_two":
                pending_mult = 3
                buff_turns = 2
            elif effect == "+2_turns":
                turns += 2
            else:
                dmg = effect * pending_mult
                total_damage += dmg
                hp -= dmg
                if buff_turns > 0:
                    buff_turns -= 1
                    if buff_turns == 0:
                        pending_mult = 1
            t += 1

        payout = gym_hp[gym] if hp <= 0 else total_damage
        if payout > 0:
            self.win_manager.update_spinwin(payout)
            self.win_manager.update_gametype_wins(self.gametype)
