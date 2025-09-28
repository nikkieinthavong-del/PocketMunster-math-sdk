# Output files

All relevant output files are automatically generated within the `game/library/` directories. If the required sub-directories do not exist, the will be automatically generated.

### Books

The primary data file output when simulations are run are the book files. These contain summary simulation information such as the final payout multiplier, basegame and freegame win contributions, the simulation criteria and simulation events. The contents of `book.events` is the information returned by the RGS `play/` API response.

The uncompressed `books/` files are used within the front-end testing framework and should be used to debug events. Only a small number of simulations should be run due to the file size. Compressed book files are what is uploaded to `AWS` and consumed by the RGS when games are being uploaded. Only data from compressed books will be returned from the `play/` API.

### Force files

Each bet mode will output a file of the format `force_mode.json`. Every time the `.record()` function is called, the description keys used as input are appended to the file. If the key already exists, the `book-id` is appended to the array. This file is used to count instances of particular events. The optimization algorithm also makes use of these keys to identify max-win and freegame books. Once all bet mode simulations are finished, a `force.json` file is output which contains all the unique fields and keys.

### Lookup tables

The final payout multiplier for each simulation is summarized in the `lookUpTable_mode.csv`. This is the file accessed by the optimization algorithm, which works by adjusting the weights, initially assigned to `1`. There is also a `IdToCriteria` file which indicates the win criteria required by a specific simulation number, and a `Segmented` file used to identify what gametype contributed to the final payout multiplier. Both these additional files are not typically uploaded to the ACP and are instead used for various analysis functions.

### Config files

There are three config files generated after all simulations and optimizations are run. `config_math.json` is used by the optimization algorithm and contains all relevant bet mode details, RTP splits and optimization parameters. `config_fe.json` is used by the front-end frame work and contains symbol information, padding reels and bet mode details which need to be displayed to players. `config.json` contains bet mode information and file hash information and used used by the RGS to determine and verify changes to files being uploaded to the ACP.

### File path construction

The `OutputFiles` class within `src/config/output_filenames` is used to construct filepaths and output filenames as well as setting up output folders if they do not yet exist.
