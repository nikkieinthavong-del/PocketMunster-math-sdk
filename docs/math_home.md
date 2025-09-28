# Stake Engine - Software Development Kit

## **Math - SDK**

### **Why Use the Math SDK?**

Traditionally, developing slot games involves navigating complex mathematical models to balance payouts, hit rates, and player engagement. This process can be time-consuming and resource-intensive. The Carrot Math SDK eliminates these challenges by providing:

- **Predefined Frameworks**: Start with customizable templates or sample games to accelerate development.
- **Mathematical Precision**: Simulate and optimize win distributions using discrete outcome probabilities, ensuring strict control over game mechanics.
- **Seamless Integration**: Outputs are formatted to align with the Carrot RGS, enabling quick deployment to production environments.
- **Scalability**: Built-in multithreading and optimization tools allow for efficient handling of large-scale simulations.

### **Who Is This For?**

The Carrot Math SDK is ideal for developers looking to:

- Create custom slot games with unique mechanics.
- Optimize game payouts and hit rates without relying on extensive manual calculations.
- Generate detailed simulation outputs for statistical analysis.
- Publish games on Stake.com with minimal friction.

### **Static File Outputs**

Physical slot-machines (and many of those used in iGaming) generate results in real time by programming game-logic onto the RGS/backend. When a game is requested, a cryptographically secure random number generator selects a random reel-stop position for every active reel, and the game-logic flows from the starting board position. The drawbacks of this method is that since a single reel-strip could easily have 100+ symbols, with typically 5 reels, there are 100^5 (10 billion) unique board combinations.Explicitly calculating game payouts or Return to Player (RTP) is often infeasible, so extensive simulations are used to estimate outcomes. Stake Engine requires all game-outcomes to be known at the time of publication. Storing instructions for all possible game outcomes is impractical. Instead, a subset of results is used to define the game.

These outputs are broken up into two main parts: 1. game logic files and 2. CSV payout summaries.
The game-logic files contain an ordered list of critical game details such as symbol names, board positions, payout amounts, winning symbol positions etc... Accompanying each simulation detailed in the game logic files is a CSV entry listing the simulation number, probability of selection, and payout amount. So upon a game round request, the RGS will consult the CSV/lookup table to select a simulation number, then return a JSON response from the game-logic file for this simulation number to the frontend, telling the web-client what to render, while also updating the players wallet with the payout amount. Breaking up these two files also allows us to exactly calculate the games RTP and essential win-distribution statistics at time of publication.

### **Get Started Today**

Dive into the technical details and explore how the Carrot Math SDK can transform your game development process. With powerful tools, sample games, and detailed documentation, you'll have everything you need to create engaging and mathematically sound games.

See [Math SDK Technical Details](math_docs/directory.md) for more details.
