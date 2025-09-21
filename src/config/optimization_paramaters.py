"""Construct optimization class from GameConfig.bet_mode specifications."""


class OptimizationParameters:
    """Construct optimization parameter class for each bet mode."""

    # TODO: PUT IN OPPOSITE AND DEFAULT "X" CONDITIONS

    def __init__(
        self,
    rtp: float | str | None = None,
    av_win: float | str | None = None,
    hr: float | str | None = None,
        bet_cost: float | None = None,
        search_conditions=None,
    ):
        if rtp is None or rtp == "x":
            assert all([av_win is not None, hr is not None]), "if RTP is not specified, hit-rate (hr) must be provided"
            assert av_win is not None and hr is not None
            if isinstance(av_win, (int, float)) and isinstance(hr, (int, float)) and hr != 0:
                rtp = round(float(av_win) / float(hr), 5)
            else:
                rtp = "x"
        none_count = sum(1 for x in [rtp, av_win, hr] if x is None)
        assert none_count < 3, "Criteria RTP is ill defined."
        assert bet_cost is not None, "Define a bet-cost for parameter."

        if rtp is None:
            assert av_win is not None and hr is not None
            if isinstance(av_win, (int, float)) and isinstance(hr, (int, float)) and hr != 0:
                rtp = round(float(av_win) / float(hr), 5)
            else:
                rtp = "x"
        elif av_win is None and all([rtp is not None, hr is not None]):
            assert hr is not None and rtp is not None
            if isinstance(rtp, (int, float)) and isinstance(hr, (int, float)):
                av_win = round(float(rtp) * float(hr), 5)
            else:
                av_win = "x"
        elif hr is None:
            if isinstance(rtp, (int, float)) and rtp != 0 and isinstance(av_win, (int, float)) and bet_cost:
                hr = round((float(av_win) / float(rtp)) / float(bet_cost), 5)
            else:
                hr = "x"

        search_range, force_search = (-1, -1), {}
        if isinstance(search_conditions, (float, int)):
            search_range = (search_conditions, search_conditions)
            force_search = {}
        elif isinstance(search_conditions, tuple):
            assert search_conditions[0] <= search_conditions[1], "Enter (min, max) payout format."
            search_range = search_conditions
            force_search = {}
        elif isinstance(search_conditions, dict):
            search_range = (-1, -1)
            force_search = search_conditions

        self.rtp = rtp
        self.av_win = av_win
        self.hr = hr
        self.search_range = search_range
        self.force_search = force_search
        self.params = self.to_dict()

    def to_dict(self):
        """JSON readable"""
        data_struct = {
            "rtp": self.rtp,
            "hr": self.hr,
            "av_win": self.av_win,
            "search_range": self.search_range,
            "force_search": self.force_search,
        }
        return data_struct
