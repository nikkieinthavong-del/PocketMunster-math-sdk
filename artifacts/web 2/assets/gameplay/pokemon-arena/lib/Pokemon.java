/**
 * Pokemon.java
 * Pokemon contructor that stores data and current state
 *
 *  @author Paul Krishnamurthy
 */

import java.util.*;

public class Pokemon extends Tools {

	int hp, energy;

	final String name;
	final int maxHP; // Starting hp for setting max restoration limit
	final String type;
	final String resistance;
	final String weakness;
	final ArrayList<Attack> attacks;

	boolean isStunned = false;  // Boolean if Pokemon's state is stunned
	boolean isDisabled = false; // Boolean if Pokemon's state is disabled

	public Random rand = new Random();

	// Constructs new Pokemon object
	public Pokemon (String name, int hp, String type, String resistance, String weakness, ArrayList<Attack> attacks) {
		this.name       = name;

		this.hp         = hp;
		this.maxHP      = hp;
		this.energy     = 50;
		
		this.type       = type;
		this.resistance = resistance;
		this.weakness   = weakness;
		
		this.attacks    = attacks;
	}

	/**
	 * List all Pokemon's attack details in a formatted table
	 */
	public void listAttacks () {
		for (int i = 0; i < attacks.size(); i++) {
			delayedLinePrint(new String[] {
				String.format("%d. %s", (i + 1), attacks.get(i).name),
				String.format("COST    : %s", attacks.get(i).cost),
				String.format("DAMAGE  : %s", attacks.get(i).damage),
				String.format("SPECIAL : %s\n", attacks.get(i).special.equals("") ? "NONE" : attacks.get(i).special.toUpperCase())	
			}, 20);
		}
	}

	/**
	 * Checks if user can afford attack
	 * 
	 * @param attack     Attack object
	 * @return           Boolean if attack can be afforded
	 */
	public boolean canAfford (Attack attack) {
		return attack.cost <= energy;
	}

	/**
	 * Generate all attacks Pokemon can afford
	 * 
	 * @return     ArrayList of attacks
	 */
	public ArrayList<Attack> affordableAttacks () {

		// ArrayList of affordable attacks
		ArrayList<Attack> affordable = new ArrayList<Attack>();

		for (int i = 0; i < attacks.size(); i++) {
			if (canAfford(attacks.get(i))) {
				affordable.add(attacks.get(i));
			}
		}

		return affordable;
	}

	/**
	 * Chooses random, affordable attack
	 * 
	 * @return     Random attack
	 */
	public Attack randomAttack () {
		ArrayList<Attack> affordables = affordableAttacks();
		return affordables.get(rand.nextInt(affordables.size()));
	}

	/**
	 * Checks if Pokemon is alive
	 * 
	 * @return     Returns true if Pokemon has more than 0 hp
	 */
	public boolean isAlive () {
		return hp > 0;
	}

	/**
	 * Resets Pokemon stats at the end of a turn
	 */
	public void resetTurn () {

		// Add 10 energy to a maximum of 50
		energy = Math.min(50, energy + 10);
	}

	/**
	 * Resets Pokemon stats at the end of a battle
	 */
	public void resetBattle () {

		// Reset energy to 50 and add 20 to hp
		energy = 50;
		hp = Math.min(maxHP, hp + 20);
	}

	/**
	 * Prints statistics about Pokemon in a nice table
	 *
	 * @param fancy     Boolean if table should be printed
	 * @return          String with hp and energy
	 */
	public void stats (boolean fancy) {
		if (fancy) {
			delayedLinePrint(new String[] {
				"\n+-----------------------------------------------+",
				"|                    STATS                      |",
				"+===============================================+",
				String.format("| HP: %5d | ENERGY : %5d | TYPE: %10s |", hp, energy, type.toUpperCase()),
				"+-----------------------------------------------+\n"
			}, 20);
		} else {
			delayedCharPrint(String.format("\nPOKEMON : %s\nHP      : %d\nENERGY  : %d\nTYPE    : %s", name, hp, energy, type.toUpperCase()), 30);
		}
	}

	/**
	 * @return     Name of Pokemon
	 */
	public String toString () {
		return name;
	}

}
