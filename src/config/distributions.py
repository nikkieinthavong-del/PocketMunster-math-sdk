"""Set and verify simulation parameters."""

from typing import Union, Dict, List, Optional, Any
import json


class Distribution:
    """Setup simulation conditions."""

    def __init__(
        self,
        criteria: Union[str, None] = None,
        quota: int = 0,
        win_criteria: Union[float, None] = None,
        conditions: Union[Dict, None] = None,
        required_distribution_conditions: List[str] = [
            "reel_weights",
        ],
    default_distribution_conditions: Optional[Dict[str, Any]] = None,
    ):
        assert quota > 0, "non-zero quota value must be assigned"

        self._quota = quota
        self._criteria = criteria
        self._required_distribution_conditions = required_distribution_conditions
        if default_distribution_conditions is None:
            default_distribution_conditions = {"force_wincap": False, "force_freegame": False}
        self._default_distribution_conditions = default_distribution_conditions
        self._win_criteria = win_criteria
        self.verify_and_set_conditions(conditions or {})

    def verify_and_set_conditions(self, conditions):
        """Enforce required conditions for distribution setup."""
        condition_keys = list(conditions.keys())
        for rk in self._required_distribution_conditions:
            assert rk in condition_keys, f"condition missing required key: {rk}. condition_keys={condition_keys}"

        for rk in list(self._default_distribution_conditions.keys()):
            if rk not in condition_keys:
                conditions[rk] = self._default_distribution_conditions[rk]

        self._conditions = conditions

    def get_criteria(self):
        """Return distribution criteria value."""
        return self._criteria

    def get_quota(self):
        """Return distribution simulation quota."""
        return self._quota

    def get_win_criteria(self):
        """Return criteria for simulation to pass."""
        return self._win_criteria

    def get_required_distribution_conditions(self):
        """Return what win conditions must be specified."""
        return self._required_distribution_conditions

    def __str__(self):
        return f"Criteria: {self._criteria}\nConditions: {json.dumps(self._conditions)}"
