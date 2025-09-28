/**
 * Attack.java
 * Constructs each attack and changes Pokemon stats when attacking
 *
 *  @author Paul Krishnamurthy
 */

import java.util.*;

public class Attack extends Tools {

	// Information about each attack -> Constants
	final String name;
	final int cost;
	final int damage;
	final String special;

	public Attack (String name, int cost, int damage, String special) {
		this.name    = name;
		this.cost    = cost;
		this.damage  = damage;
		this.special = special;
	}

	/**
	 * Changes Pokemon statistics for both Pokemon after an attack
	 * 
	 * @param predator     Pokemon object of attacking pokemon
	 * @param prey         Pokemon object of defending pokemon
	 */
	public void attack (Pokemon predator, Pokemon prey) {

		// Stores attack damage factoring in all conditions
		int attackPower = damage;

		// Display attack name
		delayedCharPrint(String.format("\n%s uses %s against %s", predator.toString(), name, prey.toString()), 40);

		predator.energy -= cost; // Lower attacker's energy

		// If attacker is disabled
		if (predator.isDisabled) {

			// Inform the player of this tragedy
			delayedCharPrint(String.format("%s is disabled, so the attack is weakened!\n", predator.toString()), 40);

			// Try to lower 10 from the attack power
			attackPower = Math.max(0, attackPower - 10);
		}

		// If the attacker or defender has a weakness
		if (predator.type.equals(prey.resistance)) {
			delayedCharPrint(String.format("\nOh no! %s is resistant to %s!\nThe attack was not that effective!", prey.toString(), name), 40);
			attackPower /= 2; // Cut attack power in half

		} else if (predator.type.equals(prey.weakness)) {
			delayedCharPrint(String.format("\n%s has a weakness to %s!\nThe attack was super effective!", prey.toString(), name), 40);
			attackPower *= 2; // Double the attack power
		}
		
		// Use a switch to handle specials
		switch (special) {

			case "STUN":

				prey.hp -= attackPower; // Attack

				// 50% chance of success to stun
				if (randChoice()) {
					prey.isStunned = true;
					delayedCharPrint(String.format("%s has been stunned!", prey.toString()), 40);
				}

				break;

			case "WILD CARD":

				// 50% chance to land successful attack
				if (randChoice()) {
					prey.hp -= attackPower;
					delayedCharPrint(String.format("%s dealt %d damage to %s!", predator.toString(), attackPower, prey.toString()), 40);
				} else {
					delayedCharPrint("The attack missed!", 40);
				}

				break;

			case "WILD STORM":

				// Keep going until randChoice() returns false
				while (randChoice()) {
					prey.hp -= attackPower; // Attack
					delayedCharPrint(String.format("%s dealt %d damage to %s!", predator.toString(), attackPower, prey.toString()), 40);
				}

				break;

			case "DISABLE":

				// Attack and disable
				prey.hp -= attackPower;
				prey.isDisabled = true;

				delayedCharPrint(String.format("%s has been disabled!", prey.toString()), 40);
				delayedCharPrint(String.format("%s dealt %d damage to %s!", predator.toString(), attackPower, prey.toString()), 40);

				break;

			case "RECHARGE":

				prey.hp -= attackPower;
				
				// Add 20 energy up till max
				predator.energy = Math.min(50, predator.energy + 20);
				delayedCharPrint(String.format("%s gained 20 energy!", predator.toString()), 40);

				delayedCharPrint(String.format("%s dealt %d damage to %s!", predator.toString(), attackPower, prey.toString()), 40);

				break;

			// Nothing special
			default:

				prey.hp -= attackPower;
				delayedCharPrint(String.format("%s dealt %d damage to %s!", predator.toString(), attackPower, prey.toString()), 40);

				break;

		}
	}

}
