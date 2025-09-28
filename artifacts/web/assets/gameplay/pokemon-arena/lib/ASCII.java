/**
 * ASCII.java
 * Stores and displays ASCII art
 *
 *  @author Paul Krishnamurthy
 */

import java.util.*;
import java.io.*;

public class ASCII extends Tools {

	// Main pokemon title
	private static String[] pokeTitle = { 
		"                               .::.                           ",
		"                              .;:**'                          ",
		"                              `                               ",
		"  .:XHHHHk.              db.   .;;.     dH  MX                ",
		"oMMMMMMMMMMM       ~MM  dMMP :MMMMMR   MMM  MR      ~MRMN     ",
		"QMMMMMb  'MMX       MMMMMMP !MX' :M~   MMM MMM  .oo. XMMM 'MMM",
		"  `MMMM.  )M> :X!Hk. MMMM   XMM.o'  .  MMMMMMM X?XMMM MMM>!MMP",
		"   'MMMb.dM! XM M'?M MMMMMX.`MMMMMMMM~ MM MMM XM `' MX MMXXMM ",
		"    ~MMMMM~ XMM. .XM XM`'MMMb.~*?**~ .MMX M t MMbooMM XMMMMMP ",
		"     ?MMM>  YMMMMMM! MM   `?MMRb.    `MM   !L'MMMMM XM IMMM   ",
		"      MMMX   'MMMM'  MM       ~%:           !Mh.''' dMI IMMP  ",
		"      'MMM.                                             IMX   ",
		"       ~M!M                                             IM    " 
	};

	// Author subtitle text
	private static String[] pokeSubtitle = {
		"                     ____             _   _  _      ",
		"                    |  _ \\ __ _ _   _| | | |/ /    ",
		"                    | |_) / _` | | | | | | ' /      ",
		"                    |  __/ (_| | |_| | | | . \\ _   ", 
		"                    |_|   \\__,_|\\__,_|_| |_|\\_(_)\n"
	};

	// Congratulations (winner) text
	private static String[] congrats = {
		" _____                             _         _       _   _                 _ ",
		"/  __ |                           | |       | |     | | (_)               | |",
		"| /  |/ ___  _ __   __ _ _ __ __ _| |_ _   _| | __ _| |_ _  ___  _ __  ___| |",
		"| |    / _ || '_ | / _` | '__/ _` | __| | | | |/ _` | __| |/ _ || '_ |/ __| |",
		"| |__/| (_) | | | | (_| | | | (_| | |_| |_| | | (_| | |_| | (_) | | | |__ |_|",
		" |____/|___/|_| |_||__, |_|  |__,_||__||__,_|_||__,_||__|_||___/|_| |_|___(_)",
		"                    __/ |                                                    ",
		"                   |___/                                                     \n"
	};

	// You lose (loser) text
	private static String[] loser = {
		"__   __            _                    _         ",
		"\\ \\ / /           | |                  | |      ",
		" \\ V /___  _   _  | |     ___  ___  ___| |       ",
		"  \\ // _ \\| | | | | |    / _ \\/ __|/ _ \\ |    ",
		"  | | (_) | |_| | | |___| (_) \\__ \\  __/_|      ",
		"  \\_/\\___/ \\__,_| \\_____/\\___/|___/\\___(_) \n"
	};

	
	/**
	 * Introduction title animations
	 */
	public static void introTitle () {
		delayedLinePrint(pokeTitle, 40);
		sleep(700);
		delayedLinePrint(pokeSubtitle, 40);
		sleep(500);
		System.out.printf("%27s", " ");
		delayedCharPrint("January 2015", 40);
		sleep(1000);
	}

	/**
	 * Prints Pokemon ASCII based on name from data file
	 * 
	 * @param name     Name of Pokemon
	 */
	public static void printPokemon (String name) {

		Scanner inFile = null;

		try {
			inFile = new Scanner(new BufferedReader(new FileReader(String.format("resources/PokemonArt/%s.txt", name))));
		} catch (IOException e) {
			delayedCharPrint(String.format("Sorry, no image for %s is available!", name), 40);
		}

		while (inFile.hasNextLine()) {
			String curLine = inFile.nextLine();
			delayedCharPrint(curLine, 1);
		}

		inFile.close();

	}

	/**
	 * ASCII Art for winning or losing
	 * 
	 * @param won     Boolean to see if user won or not
	 */
	public static void gameOver (boolean won) {
		if (won) {
			delayedLinePrint(congrats, 40);
			delayedCharPrint("You are the Trainer Supreme!", 40);
			sleep(300);
		} else {
			delayedLinePrint(loser, 40);
			delayedCharPrint("You are the Loser Supreme!", 40);
			sleep(300);
		}
	}

}

