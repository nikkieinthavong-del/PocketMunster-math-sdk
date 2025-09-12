import numpy as np

class RandomNumberGenerator:
    def __init__(self, seed: int = None):
        self.seed = seed
        self.state = np.random.RandomState(seed)

    def random(self) -> float:
        return self.state.rand()

    def randint(self, low: int, high: int) -> int:
        return self.state.randint(low, high)

    def choice(self, a, size=None, replace=True, p=None):
        return self.state.choice(a, size=size, replace=replace, p=p)