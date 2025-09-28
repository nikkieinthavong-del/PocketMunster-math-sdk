# Setup and installation

**_Running the math-sdk requires Python3 and PIP to be installed!_**

**_Rust/Cargo must also be installed for the optimization algorithm to run!_**

Clone the Math SDK repository to get started

```sh
git@github.com:StakeEngine/math-sdk.git
```

## Makefile (recommended)

Assuming [Make](https://www.gnu.org/software/make/) and a recent version of [Python3](https://www.python.org/download/releases/3.0/) is installed on your machine, the easiest method of setting up the SDK is using the terminal to invoke:

```sh
  make setup
```

This will setup and activate a Python virtual environment, installing all necessary packages as defined within **_requirements.txt_**, and install an editable math-sdk module.

Once the relavent parameters are set for a particular game, execute the run.py file using:

```sh
  make run GAME=<game_id>
```

## Installing Cargo (Only if using Optimization Algorithm)

If the optimization algorithm is being utilized, [**Rust**](https://www.rust-lang.org/) and **Cargo** should be [installed](https://doc.rust-lang.org/cargo/getting-started/installation.html).

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Manual installation

\*Note: This installation is for Mac operating systems, Windows OS uses the prefix python (instead of python3)

### Create and Activate a Virtual Environment

It's recommended to use a virtual environment to manage dependencies. Using the Virtual Environment manager (_venv_), install Python version >=3.12 using:

```sh
python3 -m venv env
```

If you are using Mac, activate the env with:

```sh
source env/bin/activate
```

If using a Windows computer use:

```sh
  env\Scripts\activate.bat
```

### Install Dependencies

Use `pip` to install dependencies from the `requirements.txt` file:

```sh
python3 -m pip install -r requirements.txt
```

### Install the Package in Editable Mode

Using the `setup.py` file, the package should be installed it in editable mode (for development purposes) with the command:

```sh
python3 -m pip install -e .
```

This allows modifications to the package source code to take effect without reinstallation.

### Verify Installation

You can check that the package is installed by running:

```sh
python3 -m pip list
```

or testing the package import in Python:

```sh
python
>>> import your_package_name
```

## Deactivating the Virtual Environment

When finished, deactivate the virtual environment with:

```sh
deactivate
```
