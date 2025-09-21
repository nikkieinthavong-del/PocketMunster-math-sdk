import random
from typing import Union, Optional, Tuple


def get_random_outcome(distribution: dict, totalWeight: Optional[float] = None) -> Union[float, int]:
    """Returns a value from a distibution passed as a dictionary: {value : weight, ...}"""
    assert isinstance(distribution, dict), "distribution must be of type: dict "
    if totalWeight is None:
        totalWeight = sum(distribution.values())
    roll = random.uniform(0, totalWeight)
    cumulative = 0.0
    for value, weight in distribution.items():
        cumulative += weight
        if cumulative >= roll:
            return value

    raise RuntimeError("error drawing item from distribution")


def get_mean_std_median(dist: dict) -> Tuple[float, float, float]:
    """Returns mean and standard deviation from an ordered win-distribution."""
    total = 0
    count = 0
    std_total = 0
    for win in dist:
        total += win * dist[win]
        count += dist[win]

    mean = total / count if count > 0 else 0
    median = 0
    sorted_dist_keys = list(dist.keys())
    sorted_dist_keys.sort()
    loop_count = 0
    has_median = False
    for win in sorted_dist_keys:
        loop_count += dist[win]
        std_total += ((win - mean) ** 2) * dist[win] / count

        if (not has_median) and loop_count > count / 2:
            median = win
            has_median = True

    return mean, std_total**0.5, median


def normalize(distribution) -> None:
    """Normalise win distribution weights."""
    count = 0
    for key in distribution:
        count += distribution[key]

    for key in distribution:
        distribution[key] = distribution[key] / count
