import { world, Dimension } from "@minecraft/server";

/**
 * Represents a three-dimensional vector.
 */
export class Vector3 {
  x: number;
  y: number;
  z: number;

  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * Checks if this vector is equal to another vector.
   *
   * @param {Vector3} other - The other vector to compare.
   * @returns {boolean} - True if vectors are equal, false otherwise.
   */
  equals(other: Vector3): boolean {
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }

  /**
   * Adds another Vector3 to this one.
   * 
   * @param {Vector3} other - The other vector to add.
   * @returns {Vector3} A new Vector3 that is the result of the addition.
   */
  add(other: Vector3): Vector3 {
    return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z);
  }

  /**
   * Subtracts another Vector3 from this one.
   * 
   * @param {Vector3} other - The other vector to subtract.
   * @returns {Vector3} A new Vector3 that is the result of the subtraction.
   */
  subtract(other: Vector3): Vector3 {
    return new Vector3(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  /**
   * Multiplies this Vector3 by a scalar value.
   * 
   * @param {number} scalar - The scalar to multiply by.
   * @returns {Vector3} A new Vector3 that is the result of the multiplication.
   */
  multiply(scalar: number): Vector3 {
    return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  /**
   * Divides this Vector3 by a scalar value.
   * 
   * @param {number} scalar - The scalar to divide by.
   * @returns {Vector3} A new Vector3 that is the result of the division.
   * @throws Will throw an error if dividing by zero.
   */
  divide(scalar: number): Vector3 {
    if (scalar !== 0) {
      return new Vector3(this.x / scalar, this.y / scalar, this.z / scalar);
    } else {
      throw new Error("Cannot divide by zero");
    }
  }

  /**
   * Calculates the magnitude (length) of the vector.
   * 
   * @returns {number} The magnitude of the vector.
   */
  magnitude(): number {
    return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
  }

  /**
   * Normalizes the vector to a unit vector.
   * 
   * @returns {Vector3} A new Vector3 that is the normalized (unit) vector.
   * @throws Will throw an error if attempting to normalize a zero vector.
   */
  normalize(): Vector3 {
    const mag = this.magnitude();
    if (mag !== 0) {
      return this.divide(mag);
    } else {
      throw new Error("Cannot normalize a zero vector");
    }
  }

  /**
   * Calculates the dot product with another vector.
   * 
   * @param {Vector3} other - The other vector.
   * @returns {number} The dot product result.
   */
  dot(other: Vector3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  /**
   * Calculates the cross product with another vector.
   * 
   * @param {Vector3} other - The other vector.
   * @returns {Vector3} A new Vector3 that is the result of the cross product.
   */
  cross(other: Vector3): Vector3 {
    return new Vector3(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x
    );
  }

  /**
   * Calculates the distance between this vector and another vector.
   * 
   * @param {Vector3} other - The other vector.
   * @returns {number} The distance between the vectors.
   */
  distance(other: Vector3): number {
    return Math.sqrt(
      (this.x - other.x) ** 2 +
      (this.y - other.y) ** 2 +
      (this.z - other.z) ** 2
    );
  }

  /**
   * Returns a string representation of the vector.
   * 
   * @returns {string} The string representation.
   */
  toString(): string {
    return `Vector3(${this.x}, ${this.y}, ${this.z})`;
  }
}

/**
 * Class to handle block matching logic.
 */
export class BlockMatcher {
  private dimension: Dimension;

  constructor(dimension: Dimension) {
    this.dimension = dimension;
  }

  /**
   * Matches a pattern of blocks in the world, with support for rotations and reflections.
   * @param pattern The pattern to match, including the trigger block and the block offsets.
   * @param options Options for matching, such as whether to destroy the blocks.
   * @returns An object indicating whether the pattern was matched, and the combination of blocks if successful.
   */
  matchBlocks(pattern: { triggerBlock: { blockType: string, location: Vector3 }, pattern: Array<{ offset: [number, number, number], blockType: string }> }, options: { destroyBlocks: boolean }) {
    const { triggerBlock, pattern: blocksToCheck } = pattern;
    const { destroyBlocks: shouldDestroyBlocks } = options;

    /**
     * Checks if a combination of blocks matches at a specific location.
     * @param baseLocation The base location to start checking from.
     * @param combination The combination of blocks to check.
     * @returns True if the combination matches, false otherwise.
     */
    const checkCombination = (baseLocation: Vector3, combination: Array<{ offset: [number, number, number], blockType: string }>): boolean => {
      for (const block of combination) {
        const [offsetX, offsetY, offsetZ] = block.offset;
        const checkLocation = new Vector3(baseLocation.x + offsetX, baseLocation.y + offsetY, baseLocation.z + offsetZ);
        const blockType = this.dimension.getBlock(checkLocation)?.typeId;

        if (blockType !== block.blockType) {
          return false;
        }
      }
      return true;
    };

    /**
     * Destroys the blocks in the given combination at the specified location.
     * @param baseLocation The base location of the pattern.
     * @param combination The combination of blocks to destroy.
     */
    const destroyBlocks = (baseLocation: Vector3, combination: Array<{ offset: [number, number, number], blockType: string }>): void => {
      const destroyBlock = (location: Vector3) => {
        world.gameRules.doTileDrops = false;
        this.dimension.runCommand(`setblock ${location.x} ${location.y} ${location.z} air destroy`);
        world.gameRules.doTileDrops = true;
      };

      destroyBlock(baseLocation);
      for (const block of combination) {
        const [offsetX, offsetY, offsetZ] = block.offset;
        destroyBlock(new Vector3(baseLocation.x + offsetX, baseLocation.y + offsetY, baseLocation.z + offsetZ));
      }
    };

    /**
     * Generates all possible rotations and reflections of the pattern.
     * @param pattern The base pattern to rotate and reflect.
     * @returns An array of unique patterns generated from rotations and reflections.
     */
    const generateCombinations = (pattern: Array<{ offset: [number, number, number], blockType: string }>): Array<Array<{ offset: [number, number, number], blockType: string }>> => {
      const rotations: Array<Array<{ offset: [number, number, number], blockType: string }>> = [];

      // Add the original pattern
      rotations.push(pattern);

      // Rotate around Y-axis (90, 180, 270 degrees)
      rotations.push(pattern.map(b => ({ offset: [b.offset[2], b.offset[1], -b.offset[0]], blockType: b.blockType })));
      rotations.push(pattern.map(b => ({ offset: [-b.offset[0], b.offset[1], -b.offset[2]], blockType: b.blockType })));
      rotations.push(pattern.map(b => ({ offset: [-b.offset[2], b.offset[1], b.offset[0]], blockType: b.blockType })));

      // Rotate around X-axis (90, 180, 270 degrees)
      rotations.push(pattern.map(b => ({ offset: [b.offset[0], -b.offset[2], b.offset[1]], blockType: b.blockType })));
      rotations.push(pattern.map(b => ({ offset: [b.offset[0], -b.offset[1], -b.offset[2]], blockType: b.blockType })));
      rotations.push(pattern.map(b => ({ offset: [b.offset[0], b.offset[2], -b.offset[1]], blockType: b.blockType })));

      // Rotate around Z-axis (90, 180, 270 degrees)
      rotations.push(pattern.map(b => ({ offset: [-b.offset[1], b.offset[0], b.offset[2]], blockType: b.blockType })));
      rotations.push(pattern.map(b => ({ offset: [-b.offset[0], -b.offset[1], b.offset[2]], blockType: b.blockType })));
      rotations.push(pattern.map(b => ({ offset: [b.offset[1], -b.offset[0], b.offset[2]], blockType: b.blockType })));

      // Generate reflections for each rotation
      const reflections = rotations.flatMap(rotation => [
        rotation,
        rotation.map(b => ({ offset: [-b.offset[0], b.offset[1], b.offset[2]], blockType: b.blockType })), // Reflect across X-axis
        rotation.map(b => ({ offset: [b.offset[0], -b.offset[1], -b.offset[2]], blockType: b.blockType })), // Reflect across Y-axis
        rotation.map(b => ({ offset: [b.offset[0], b.offset[1], -b.offset[2]], blockType: b.blockType })), // Reflect across Z-axis
      ]);

      // Remove duplicate patterns
      const uniquePatterns = new Set(reflections.map(rotation => JSON.stringify(rotation)));
      return Array.from(uniquePatterns).map(pattern => JSON.parse(pattern));
    };

    const possibleCombinations = generateCombinations(blocksToCheck);

    for (const combination of possibleCombinations) {
      if (checkCombination(triggerBlock.location, combination)) {
        if (shouldDestroyBlocks) {
          destroyBlocks(triggerBlock.location, combination);
        }
        return {
          matched: true,
          combination,
          center: triggerBlock.location
        };
      }
    }

    return { matched: false };
  }
}