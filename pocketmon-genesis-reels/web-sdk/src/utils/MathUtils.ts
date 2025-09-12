import { randomInt } from 'crypto';

/**
 * Generates a random integer between min (inclusive) and max (inclusive).
 * @param min - The minimum value (inclusive).
 * @param max - The maximum value (inclusive).
 * @returns A random integer between min and max.
 */
export function getRandomInt(min: number, max: number): number {
    return randomInt(min, max + 1);
}

/**
 * Calculates the average of an array of numbers.
 * @param numbers - An array of numbers.
 * @returns The average of the numbers.
 */
export function calculateAverage(numbers: number[]): number {
    const total = numbers.reduce((acc, num) => acc + num, 0);
    return total / numbers.length;
}

/**
 * Calculates the standard deviation of an array of numbers.
 * @param numbers - An array of numbers.
 * @returns The standard deviation of the numbers.
 */
export function calculateStandardDeviation(numbers: number[]): number {
    const avg = calculateAverage(numbers);
    const squareDiffs = numbers.map(num => Math.pow(num - avg, 2));
    const avgSquareDiff = calculateAverage(squareDiffs);
    return Math.sqrt(avgSquareDiff);
}

/**
 * Clamps a number between a minimum and maximum value.
 * @param value - The number to clamp.
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns The clamped value.
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}