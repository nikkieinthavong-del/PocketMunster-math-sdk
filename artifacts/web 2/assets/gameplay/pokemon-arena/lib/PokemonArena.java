/**
 * PokemonArena.java
 * Main class with entire game sequence
 *
 *  @author Paul Krishnamurthy
 */

import java.util.*;

public class PokemonArena extends Tools {

	private static PokemonCollection pokeLot      = new PokemonCollection();
	private static ArrayList<Pokemon> pokemonTeam = new ArrayList<Pokemon>();
	private static Scanner stdin                  = new Scanner(System.in);

	public static void main (String[] args) {

		gameIntro();

		selectPokemon();

		boolean winning = true;

		// While there are Pokemon to fight and Pokemon on user's team
		while (pokeLot.pokemons.size() > 0 && pokemonTeam.size() > 0) {

			// Reset Pokemon stats per battle 
			for (Pokemon p : pokemonTeam) {
				p.resetBattle();
			}

			// Randomly select if user or computer goes first
			String starter = randChoice() ? "user" : "enemy";
			winning = battleSequence(pokeLot.randomPokemon(), starter);

		}

		if (winning) {
			ASCII.gameOver(true);
		} else {
			ASCII.gameOver(false);
		}

	}

	/**
	 * Graphic sequence for game introduction
	 */
	public static void gameIntro () {

		// Display titles
		ASCII.introTitle();
		clearConsole();

		// Prompt for enter to be pressed
		getString("enter", "Press [enter] to start...", false);
		clearConsole();

		// Welcome message
		delayedLinePrint(new String[] {
			"Welcome to the Pokemon Arena!",
			"Be prepared for what lies ahead!",
			"Start off by picking your team...", "\n"
		}, 20);

		sleep(1000);
	}

	/**
	 * Method for user to select 4 Pokemon for their team
	 */
	public static void selectPokemon () {

		int chosen = 0; // Counter for number of selected Pokemon

		while (chosen != 4) {
			delayedCharPrint("Pick " + (4 - chosen) + " pokemon for your collection!", 40);

			delayedCharPrint("Here are your options: ", 40);
			listPokemon(pokeLot.pokemons); // List all available options to chose from

			// Get the user's selection as a Pokemon object
			int selectedPokemonIndex = getInt(1, pokeLot.pokemons.size(), "Enter number: ");
			Pokemon selectedPokemon = pokeLot.pokemons.get(selectedPokemonIndex - 1);

			// Print Pokemon and details
			ASCII.printPokemon(selectedPokemon.toString());
			selectedPokemon.stats(true);

			// Yes/No confirmation to choose Pokemon
			String confirmation = getString("", String.format("Would you like to choose %s [y/n]? ", selectedPokemon.toString()), true);

			if (confirmation.toLowerCase().equals("y")) {

				// Add to the pokemon team and remove from the options
				pokemonTeam.add(selectedPokemon);
				pokeLot.removePokemon(selectedPokemon);

				delayedCharPrint(String.format("\nYou selected: %s!\n", selectedPokemon.toString()), 40);

				chosen ++;
			}

		}

		// Display user's Pokemon team
		listOptions(new String[] {
			pokemonTeam.get(0).toString(),
			pokemonTeam.get(1).toString(),
			pokemonTeam.get(2).toString(),
			pokemonTeam.get(3).toString(),
		}, "Awesome! Here is your team:\n");

		sleep(500);
		getString("enter", "\nAre you ready to fight? Press [enter]", false);
		clearConsole();
	}

	/**
	 * Choses Pokemon from current team
	 * 
	 * @return     The selected Pokemon
	 */
	public static Pokemon choseFromTeam () {

		delayedLinePrint(new String[] {
			"Select your Pokemon!",
			"Here is your team:"
		}, 30);

		listPokemon(pokemonTeam); // List all the Pokemon

		// Select and return Pokemon
		int pokeIndex = getInt(1, pokemonTeam.size(), "\nEnter your number: ");
		Pokemon curPokemon = pokemonTeam.get(pokeIndex - 1);

		delayedCharPrint(String.format("%s, I choose you!\n", curPokemon.toString()), 30);

		return curPokemon;
	}

	/**
	 * Enemy attack sequence
	 * 
	 * @param  enemy       Enemy Pokemon object
	 * @param  user        User Pokemon object
	 */
	public static void enemyAttack (Pokemon enemy, Pokemon user) {

		if (!enemy.isStunned) {
			if (enemy.affordableAttacks().size() > 0) {

				Attack randEnemyAttack = enemy.randomAttack();
				randEnemyAttack.attack(enemy, user);
				enemy.resetTurn();

			} else {
				delayedCharPrint("Enemy passes!", 30);
			}
		} else {
			delayedCharPrint("The enemy is stunned!", 30);
			enemy.isStunned = false; // Unstun enemy
		}

	}

	/**
	 * Reset Pokemon statistics every turn
	 * 
	 * @param enemy     Enemy Pokemon object
	 */
	public static void resetAllPokemon (Pokemon enemy) {

		// End turn for all Pokemon on user's team
		for (Pokemon p : pokemonTeam) {
			p.resetTurn();
		}

		// End enemy's turn
		enemy.resetTurn();
	}

	/**
	 * Battle sequence with one enemy
	 * 
	 * @param  enemy     Pokemon enemy object
	 * @return           Boolean if user's Pokemon won or lost
	 */
	public static boolean battleSequence (Pokemon enemy, String starter) {

		boolean isWinnning  = true; // Boolean if user wins or loses battle

		// Define types outside loop for efficiency
		int curAction, attackCount, selection;
		Attack curAttack;

		delayedCharPrint(String.format("A wild %s appears! Get ready to fight!\n", enemy.toString()), 40);

		Pokemon userPokemon = choseFromTeam(); // Select current Pokemon

		// Notify user of who starts
		delayedCharPrint(String.format("%s start's the battle!\n", (starter.equals("user") ? userPokemon.toString() : enemy.toString())), 30);

		// Loop while user and enemy Pokemon are alive
		while (userPokemon.isAlive() && enemy.isAlive()) {

			boolean moveOn = false; // Used to break out of turn loops 

			// User attack
			if (starter.equals("user")) {

				while (true) {

					// List menu options
					listOptions(new String[] {
						"Attack",
						"Retreat",
						"Pass",
						"Stats",
						"View",
						"Help"
					}, "\nSelect your action!");

					curAction = getInt(1, 6, "\nEnter number: "); // Select option

					// clearConsole(); // UNCOMMENT TO CLEAN TEXT AFTER CYCLE

					switch (curAction) {

						// Attack
						case 1:
							while (true) {
								delayedCharPrint("\nENTER < 0 > TO GO BACK\n", 30);
								delayedCharPrint("Select an attack! Here are your options:\n", 30);
			
								userPokemon.listAttacks(); // Display attack options

								// Get attack
								attackCount = userPokemon.attacks.size();
								selection = getInt(0, attackCount, "\nEnter number: ");

								// Go back
								if (selection == 0) {
									moveOn = false;
									break;
								}

								// Try to attack
								curAttack = userPokemon.attacks.get(selection - 1);

								// Try to attack enemy
								if (userPokemon.canAfford(curAttack)) {
									curAttack.attack(userPokemon, enemy);
									moveOn = true;
									break;

								} else {
									delayedCharPrint(String.format("\nYou cannot affort that attack!\nIt costs %s!", curAttack.cost), 30);
								}

							}

							break;

						// Retreat (switch pokemon and end turn)
						case 2:
							delayedCharPrint("You retreated!\n", 30);
							userPokemon = choseFromTeam();
							moveOn = true; // Switch turns
							break;

						// Pass (nothing happens)
						case 3:
							delayedCharPrint("You passed your turn!", 30);
							moveOn = true;
							break;

						// Stats
						case 4:
							userPokemon.stats(false);
							break;

						// View
						case 5:
							ASCII.printPokemon(userPokemon.toString());
							break;

						// Help
						case 6:
							Tools.help();
							break;
					}

					if (moveOn) {
						break;
					}
				}

				// Check if enemy is dead
				if (!enemy.isAlive()) {

					delayedCharPrint(String.format("The wild %s fainted!", enemy.toString()), 30);

					// Remove enemy Pokemon
					pokeLot.removePokemon(enemy);

					isWinnning = true;
					break;
				}

			// Enemy attack
			} else {

				enemyAttack(enemy, userPokemon); // Enemy attacks user

				// Check if user is fainted
				if (!userPokemon.isAlive()) {

					delayedCharPrint(String.format("%s fainted!", userPokemon.toString()), 30);
					isWinnning = false;

					// Remove user Pokemon
					pokemonTeam.remove(userPokemon);

					// If the user has Pokemon that have not fainted
					if (pokemonTeam.size() > 0) {
						isWinnning = true;
					}

					if (isWinnning) {

						// Choose new Pokemon
						userPokemon = choseFromTeam();
						moveOn = false;
						starter = "user"; // User starts
						continue;

					} else {
						delayedCharPrint("Oh no! All your Pokemon have fainted!", 30);
						return false; // 
					}

				}

			}

			// End of a turn
			resetAllPokemon(enemy); // Reset Pokemon stats
			starter = starter.equals("user") ? "enemy" : "user"; // Alternate turn

		}

		return isWinnning;
	}

}

