/**
 * Tools.java
 * Useful tools used throughout the game sequence
 *
 *  @author Paul Krishnamurthy
 */

import java.util.*;
import java.io.Console;

public class Tools {

	private static Scanner stdin   = new Scanner(System.in);
	private static Console console = System.console();
	private static Random rand     = new Random();

	/**
	 * Pauses the program for a given duration
	 * 
	 * @param milliseconds    The duration, in milliseconds, to pause the program
	 */
	public static void sleep (long milliseconds) {

		try {
			Thread.sleep(milliseconds);
		} catch (InterruptedException e) {
			e.printStackTrace();
		}

	}

	/**
	 * Prints a string to the console with a typing effect
	 * 
	 * @param contents          The contents to be printed
	 * @param  milliseconds     Duration to sleep in milliseconds
	 */
	public static void delayedCharPrint (String content, long milliseconds) {

		for (int i = 0; i < content.length(); i++) {

			// Don't sleep for spaces
			if (content.charAt(i) == ' ') {
				System.out.print(content.charAt(i));
			} else {
				System.out.print(content.charAt(i));
				sleep(milliseconds);
			}
		}

		System.out.println();

	}

	/**
	 * Prints lines of multiline text with a delay
	 * 
	 * @param multiline         String array of lines to print
	 * @param  milliseconds     Duration to sleep in milliseconds 
	 */
	public static void delayedLinePrint (String[] multiline, long milliseconds) {
		for (int i = 0; i < multiline.length; i++) {
			System.out.println(multiline[i]);
			sleep(milliseconds);
		}
	}

	/**
	 * Displays and numbers Pokemon in a styled table
	 * 
	 * @param pokemons     ArrayList of Pokemon objects
	 */
	public static void listPokemon (ArrayList<Pokemon> pokemons) {

		int limit = pokemons.size(); // The number of Pokemon

		// Display data in a formatted table
		// Special formatting for spaces required for row with single and double digit numbers
		System.out.println(limit != 1 ? "+---------------------------------+" : "+----------------+");

		for (int i = 0; i < limit; i++) {

			// Display two Pokemon names side-by-side
			if (i + 1 < limit) {

				if (i > 9) {
					delayedCharPrint(String.format("| %d. %10s | %d. %10s |", (i + 1), pokemons.get(i).toString(), (i + 2), pokemons.get(i + 1).toString()), 4);
				} else {
					if (i == 8) {
						delayedCharPrint(String.format("| %d. %11s | %d. %10s |", (i + 1), pokemons.get(i).toString(), (i + 2), pokemons.get(i + 1).toString()), 4);
					} else {
						delayedCharPrint(String.format("| %d. %11s | %d. %11s |", (i + 1), pokemons.get(i).toString(), (i + 2), pokemons.get(i + 1).toString()), 4);
					}
				}

				i += 1;
				System.out.println("+---------------------------------+");

			// Display a row with only 1 Pokemon name
			} else {

				if (i > 9) {
					delayedCharPrint(String.format("| %d. %10s |", (i + 1), pokemons.get(i).toString()), 4);
					System.out.println("+----------------+");
				} else {
					delayedCharPrint(String.format("| %d. %11s |", (i + 1), pokemons.get(i).toString()), 4);
					System.out.println("+----------------+");
				}

				break;
			}

		}

	}

	/**
	 * Displays a set of options in a nice table
	 * 
	 * @param options     String[] of options
	 * @param message     Message to be displayed
	 */
	public static void listOptions (String[] options, String message) {

		int limit = options.length;

		delayedCharPrint(message, 30);

		// Create table
		System.out.println("+---------------------------------+");
		for (int i = 0; i < limit; i++) {
			if (i + 1 < limit) {
				delayedCharPrint(String.format("| %d. %11s | %d. %11s |", (i + 1), options[i], (i + 2), options[i + 1]), 5);
				i += 1;
				System.out.println("+---------------------------------+");
			}
		}

	}

	/**
	 * Method to get a string input
	 * 
	 * @param  toFind     Used to check if checking for enter pressed
	 * @param  inline     Boolean to invoke new line
	 * @return            Input string
	 */
	public static String getString (String toFind, String message, boolean inline) {

		String output = "";

		if (inline) {
			System.out.print(message);
		} else {
			delayedCharPrint(message, 30);
		}
		
		if (toFind.equals("enter")) {
			// Mask input to appear as only enter was pressed
			char[] hidden = console.readPassword("");
			output = "enter";
		} else {
			output = stdin.nextLine();
		}

		return output;
	}

	/**
	 * Method to get an int input
	 * 
	 * @param  min          Minimum range for number
	 * @param  max          Maximum range for number
	 * @param  message      Message prompt before input
	 * @return              The valid number entered
	 */
	public static int getInt (int min, int max, String message) {

		int n; // User input holder

		while (true) {

			System.out.print(message);
			String input = stdin.nextLine();

			// Try to parse input as an integer
			try {
				n = Integer.parseInt(input);
			} catch (NumberFormatException e) {
				System.out.println("Please enter a number!");
				continue; // Skip to next iteration
			}

			// If the number is not an acceptable range
			if (n < min || n > max) {
				System.out.printf("That's not an option! Enter a number in the range of %d and %d!\n", min, max);
			} else {
				break; // Valid input 
			}

		}

		return n;
	}

	/**
	 * Returns true or false, randomly
	 * 
	 * @return     true or false
	 */
	public static boolean randChoice () {
		return rand.nextBoolean();
	}

	/**
	 * Clears console based on operating system
	 */
	public static void clearConsole () {

		// Clear differently based on operating system using appropriate command
		try {

			// Invoking console clearing properly thanks to StackOverflow
			if (System.getProperty("os.name").toLowerCase().contains("windows")) {
				new ProcessBuilder("cmd", "/c", "cls").inheritIO().start().waitFor();
			} else {
				System.out.print("\033[H\033[2J");  
				System.out.flush();
			}

		} catch (Exception e) {

			// If all else fails, print some blank lines!
			for (int i = 0; i < 40; i++) {
				System.out.println();
			}
		}

	}

	/**
	 * Displays command options in a help menu
	 */
	public static void help () {

		// Print help menu faster
		delayedLinePrint(new String[] {
			"1. ATTACK  - Attack the enemy",
			"2. RETREAT - Switch your Pokemon",
			"3. PASS    - Skip your turn",
			"4. STATS   - View Pokemon statistics",
			"5. VIEW    - View picture of Pokemon"
		}, 20);

	}

}
