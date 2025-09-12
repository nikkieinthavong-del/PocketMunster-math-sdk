export interface Animation {
    name: string;
    duration: number; // Duration in milliseconds
    loop: boolean; // Whether the animation should loop
}

export interface ParticleEffect {
    type: string; // Type of particle effect (e.g., explosion, sparkles)
    position: { x: number; y: number }; // Position of the effect
    lifetime: number; // Lifetime of the effect in milliseconds
    properties: Record<string, any>; // Additional properties specific to the effect
}

export interface EvolutionAnimation {
    from: string; // Pokémon being evolved
    to: string; // Pokémon after evolution
    duration: number; // Duration of the evolution animation
    effects: ParticleEffect[]; // Effects to display during evolution
}