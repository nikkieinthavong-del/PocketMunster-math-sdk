from src.config.constants import *  # noqa: F401,F403
from typing import List


class BetMode:
    """
    ##Sample BetMode Input Criteria##
    name="base",
    title="Base Game",
    description="Starting Game Mode",
    rtp=0.965,
    cost=1.0,
    auto_close_disabled=False,
    is_feature = False,
    is_enhanced_mode=False,
    is_buybonus=False,
    max_win=self.wincap,
    """

    def __init__(
        self,
        name: str,
        cost: float,
        rtp: float,
        max_win: float,
        auto_close_disabled: bool,
        is_feature: bool,
        is_buybonus: bool,
        distributions: List[object],
    ):
        self._name = name
        self._cost = cost
        self._wincap = max_win
        self._auto_close_disabled = auto_close_disabled
        self._is_feature = is_feature
        self._is_buybonus = is_buybonus
        self._distributions = distributions
        self.set_rtp(rtp)
        self.set_force_keys()

    def __repr__(self):
        return (
            "BetMode("
            f"name={self._name}, "
            f"cost={self._cost}, "
            f"max_win={self._wincap}, "
            f"rtp={self._rtp}, "
            f"auto_close_disabled={self._auto_close_disabled}, "
            f"is_feature={self._is_feature}, "
            f"is_buybonus={self._is_buybonus}"
            ")"
        )

    def set_rtp(self, rtp: float) -> None:
        """Set mode RTP."""
        if rtp >= 1.0:
            raise Warning(f"Return To Player is >=1.0!: {rtp}")
        self._rtp = rtp

    def set_force_keys(self):
        """Initialize force keys."""
        self._force_keys = []

    def add_force_key(self, force_key: list):
        """Update force keys."""
        self._force_keys.append(str(force_key))  # type:ignore

    def lock_force_keys(self):
        """Finalize force keys at the end of betmode simulation."""
        self._force_keys = tuple(sorted(self._force_keys))

    def get_force_keys(self):
        """Return current force keys."""
        return self._force_keys

    def get_name(self):
        """Return mode name."""
        return self._name

    def get_cost(self):
        """Return mode cost."""
        return self._cost

    def get_feature(self):
        """Return feature"""
        return self._is_feature

    def get_auto_close_disabled(self):
        """
        Auto close tells RGS if bet should be automatically closed (contacting the /endround API)
        if the payout multiplier is 0x. Calling /endround means the player will not be able to
        resume an interrupted bet.
        """
        return self._auto_close_disabled

    def get_buybonus(self) -> bool:
        """Returns True if BetMode is a buy-bonus."""
        return self._is_buybonus

    def get_wincap(self) -> float:
        """Returns value of maximum win amount."""
        return self._wincap

    def get_rtp(self) -> float:
        """Returns total BetMode RTP."""
        return self._rtp

    def get_distributions(self) -> list:
        """Returns list of all BetMode distributions."""
        return self._distributions

    def get_distribution_conditions(self, targetCriteria: str) -> dict:
        """Returns conditions required for distribution simulation to be accepted."""
        for d in self.get_distributions():
            if getattr(d, "_criteria", None) == targetCriteria:
                return getattr(d, "_conditions")
        raise RuntimeError(f"target criteria: {targetCriteria} not found in betmode-distributions.")
