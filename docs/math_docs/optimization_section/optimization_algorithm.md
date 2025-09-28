# Optimizing win distributions with iterative weighted sampling

A discussion of how the provided optimization algorithm operates can be viewed by [downloading this paper](distribution_optimization.pdf).

The aforementioned algorithm is implemented in the Rust programming language, this program compiles down to a binary executable. If the program is being run for the first time, or if there are modifications made to the _main.rs_ file, the binary should be rebuilt using:

```sh
cargo build --release
```

## Setting up optimization parameters

The optimization algorithm parameters can be setup and passed within the _run.py_ file
Game-specific parameters should be set using the **OptimizationSetup** class. This Class takes as input the game configuration class and appends _opt_params_. This is a dictionary where the keys are the betmode names and have the required inputs:

```python
opt_params = <mode_name> : {
    "conditions": ...
    "scaling": ...
    "parameters:
}
```

Each key has a corresponding construction class within `optimization_algorithm/optimization_config.py`

#### Conditions

The `conditions` key has the setup class `ConstructConditions`. This key separates out specific simulation numbers which the optimization algorithm is applied to. The optimization program requires knowing what RTP to optimize a subset of solutions to.
This is generally separated out into events where it is desirable to control the frequency of such an event occurring. Such as freegame, max wins or 0-win hit-rates. For each of these win types, we need to have a well defined RTP, meaning that we need 2 of the 3 variables, _RTP_, _average wins_, _hit-rates_. You will notice that for the _0 win_ conditions in the sample game the hit-rate is undefined (_x_), this is allowed because it is a free-variable. Since all hit-rates of all win-types must sum to be exactly 1, we are able to deduce the hit-rate using 1 - (sum of all other win-type allocations).

**IMPORTANT:** The order of the _conditions_ keys matters, as the simulation ids corresponding to each of these keys must be exclusive. The optimization tool reads these conditions entries in order and assigns the corresponding simulation-ids to each key before removing them from the available pool of simulations. So for example, a _wincap_ simulation will mostly likely also correspond to a _freegame_ simulation, therefore _wincap_ must be called first.

#### Scaling

We are able to bias particular win-ranges within the optimization program. We initially generating our trial distributions, we can artificially increase or decrease the the Gaussian weights within this range by a particular scale factor. We can also assign a probability of these weights being assigned for each distribution created. Note that biasing particular ranges by a significant amount can be lead to a lower likelihood of a randomly assigned distribution being accepted, so its effect should be used carefully.

#### Parameters

This input is used to construct a setup file red by the optimization tool. It defines the number of distributions to trial before combination, minimum and maximum mean-to-median distribution scores to control volatility as well as the number of simulated test spins to run in order to rank viable distributions.

## Executing optimization script

Once the game specific `OptimizationSetup` class is constructed, a `math_config.json` file is generated containing all relevant game parameters in conjunction with a `setup.txt` file detailing simulation setup optimization parameters, handled with the `OptimizationExecution` class. Within the `run.py` file we can specify which game modes we would like to optimize and directly run the Rust binary using:

```python
optimization_modes_to_run = ["base", "bonus"]
OptimizationExecution().run_all_modes(config, optimization_modes_to_run, rust_threads)
```
