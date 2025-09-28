/**
 * PokemonCollection.java
 * Stores all pokemon from "resources/pokemon.txt" data file
 *
 *  @author Paul Krishnamurthy
 */

import java.util.*;
import java.io.*;

public class PokemonCollection {

	// ArrayList to hold all pokemon
	public static ArrayList<Pokemon> pokemons = new ArrayList<Pokemon>();
	
	public static Random rand = new Random();

	// Slice data file in the constructor
	public PokemonCollection () {

		Scanner inFile;

		// Try and catch the IOException
		try {
			inFile = new Scanner(new BufferedReader(new FileReader("resources/pokemon.txt")));
		} catch (IOException e) {
			System.out.println("Could not loadfile 'resources/pokemon.txt'!");
			System.exit(-1); // Exit program if file could not be found
			return;
		}

		// Create a Pokemon[] based on the number of Pokemon
		int pokeNum = inFile.nextInt();
		Pokemon[] pokemon = new Pokemon[pokeNum];

		inFile.nextLine(); // Skip to next line

		for (int i = 0; i < pokeNum; i++) {
			// Pass string to processLine method
			processLine(inFile.nextLine());
		}

		inFile.close();
	}

	/**
	 * Constructs a new pokemon and attack with a line from the data file
	 * 
	 * @param data     String line of data from the "resources/pokemon.txt" data file
	 */
	public static void processLine (String data) {

		String[] content          = data.split(","); // Data line

		// Pokemon attributes
		String name               = content[0];
		int hp                    = Integer.parseInt(content[1]);
		String resistance         = content[3];
		String weakness           = content[4];
		int attackNums            = Integer.parseInt(content[5]);
		ArrayList<Attack> attacks = new ArrayList<Attack>();

		// Set type to "NONE" if not specified
		String type               = content[2].equals(" ") ? "NONE" : content[2];

		int add = 0; // Number to help with slicing from data string

		for (int i = 0; i < attackNums; i++) {
			// Contruct a new attack and add it to attacks list
			// Set special to "NONE" if not specified

			attacks.add(new Attack(content[6 + add], 
							Integer.parseInt(content[6 + add + 1]),
							Integer.parseInt(content[6 + add + 2]),
							content[6 + add + 3].equals(" ") ? "NONE" : content[6 + add + 3].toUpperCase()));
			add += 4;
		}

		// Add new pokemon object to ArrayList
		pokemons.add(new Pokemon(name, hp, type, resistance, weakness, attacks));
	}

	/**
	 * Returns a random pokemon from the pokemon ArrayList
	 * Removes the chosen pokemon from the ArrayList
	 * 
	 * @return selected     Randomly selected Pokemon object
	 */
	public static Pokemon randomPokemon () {

		// Select a random Pokemon, remove it from pokemons ArrayList and return it
		Pokemon selected = pokemons.get(rand.nextInt(pokemons.size()));
		removePokemon(selected);
		return selected;
	}

	/**
	 * Removes pokemon from ArrayList based on name
	 * 
	 * @param name     Name of pokemon
	 */
	public static void removePokemon (Pokemon p) {
		pokemons.remove(p);
	}
}
