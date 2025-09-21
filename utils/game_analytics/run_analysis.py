"""Print .xlsx format summary document.
Args:
    - game-id, must match folder_name in src/games/<game-id>
    - Define search keys as listed in force_record_<mode>.json file. Partial keys in the force-file are matched to search keys

"""

from typing import List, Dict, Optional
from utils.game_analytics.retrieve_game_information import GameInformation
from utils.game_analytics.print_all_results import PrintJSON, PrintXLSX


def create_stat_sheet(game: str, custom_keys: Optional[List[Dict]] = None):
    """Function executed from run file."""
    game_obj = GameInformation(game, custom_keys=custom_keys)
    PrintJSON(game_obj)
    PrintXLSX(game_obj)
