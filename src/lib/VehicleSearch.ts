export interface VehicleRequest {
  length: number;
  quantity: number;
}

export interface Listing {
  id: string;
  length: number;
  width: number;
  location_id: string;
  price_in_cents: number;
}

export interface SearchResult {
  location_id: string;
  listing_ids: string[];
  total_price_in_cents: number;
}

export class VehicleSearch {
  private locations: Record<string, Listing[]>;

  constructor(listings: Listing[]) {
    this.locations = {};
    for (const listing of listings) {
      (this.locations[listing.location_id] ??= []).push(listing);
    }
  }

  find(requests: VehicleRequest[]): SearchResult[] {
    if (requests.some((r) => r.quantity < 0)) {
        throw new Error("Vehicle quantity cannot be negative");
    }

    const vehicles = requests
      .filter((r) => r.quantity > 0)
      .flatMap((r) => Array(r.quantity).fill(r.length));

    if (vehicles.length === 0) {
      return [];
    }

    const results: SearchResult[] = [];

    for (const [location_id, locationListings] of Object.entries(this.locations)) {
      const bestCombination = this.findBestCombinationForLocation(
        vehicles,
        locationListings
      );
      if (bestCombination) {
        results.push({
          location_id,
          listing_ids: bestCombination.listing_ids.sort(),
          total_price_in_cents: bestCombination.price,
        });
      }
    }

    return results.sort(
      (a, b) => a.total_price_in_cents - b.total_price_in_cents
    );
  }

  private findBestCombinationForLocation(
    vehicles: number[],
    listings: Listing[]
  ): { price: number; listing_ids: string[] } | undefined {
    const partitions = this.generatePartitions(vehicles);

    let bestCombination: { price: number; listing_ids: string[] } | undefined;

    for (const partition of partitions) {
      const combination = this.findCheapestAssignment(partition, listings);

      if (combination) {
        if (!bestCombination || combination.price < bestCombination.price) {
          bestCombination = combination;
        }
      }
    }

    return bestCombination;
  }

  private findCheapestAssignment(
    vehicleSubsets: number[][],
    listings: Listing[]
  ): { price: number; listing_ids: string[] } | undefined {
    const sortedListings = [...listings].sort(
      (a, b) => a.price_in_cents - b.price_in_cents
    );

    const result = this.solveAssignment(
      0,
      new Set(),
      vehicleSubsets,
      sortedListings,
      {}
    );
    
    return result === null ? undefined : result;
  }

  private solveAssignment(
    subsetIndex: number,
    usedListingIds: Set<string>,
    vehicleSubsets: number[][],
    sortedListings: Listing[],
    memo: Record<string, { price: number; listing_ids: string[] } | null>
  ): { price: number; listing_ids: string[] } | null {
    if (subsetIndex === vehicleSubsets.length) {
      return { price: 0, listing_ids: [] };
    }
    
    const usedIdsKey = Array.from(usedListingIds).sort().join(',');
    const memoKey = `${subsetIndex}:${usedIdsKey}`;
    const cached = memo[memoKey];
    if (cached !== undefined) {
      return cached;
    }

    const currentSubset = vehicleSubsets[subsetIndex];
    if (currentSubset === undefined) {
      return null;
    }
    let bestResult: { price: number; listing_ids: string[] } | null = null;

    for (const listing of sortedListings) {
      if (!usedListingIds.has(listing.id)) {
        if (this.canFit(currentSubset, listing)) {
          usedListingIds.add(listing.id);
          const subProblemResult = this.solveAssignment(
            subsetIndex + 1,
            usedListingIds,
            vehicleSubsets,
            sortedListings,
            memo
          );
          usedListingIds.delete(listing.id);

          if (subProblemResult !== null) {
            const currentPrice = listing.price_in_cents + subProblemResult.price;
            if (bestResult === null || currentPrice < bestResult.price) {
              bestResult = {
                price: currentPrice,
                listing_ids: [listing.id, ...subProblemResult.listing_ids],
              };
            }
          }
        }
      }
    }

    memo[memoKey] = bestResult;
    return bestResult;
  }

  private generatePartitions<T>(set: T[]): T[][][] {
    if (set.length === 0) {
      return [[]];
    }
    const element = set[0];
    if (element === undefined) {
      return [[]];
    }

    const rest = set.slice(1);
    
    const smallerPartitions = this.generatePartitions(rest);
    const allPartitions: T[][][] = [];
    for (const partition of smallerPartitions) {
      // Add element as a new subset
      allPartitions.push([[element], ...partition]);
      // Add element to each existing subset
      for (let i = 0; i < partition.length; i++) {
        const newPartition = partition.map((subset, j) =>
          i === j ? [...subset, element] : subset
        );
        allPartitions.push(newPartition);
      }
    }
    return allPartitions;
  }

  private canFit(
    vehicleLengths: number[],
    listing: { length: number; width: number }
  ): boolean {
    if (vehicleLengths.length === 0) {
      return true;
    }
    const sumLengths = vehicleLengths.reduce((a, b) => a + b, 0);
    const maxLength = Math.max(...vehicleLengths);
    const vehicleWidth = 10;

    // Orientation 1: vehicles parallel to listing length
    const lanes1 = Math.floor(listing.width / vehicleWidth);
    if (lanes1 > 0) {
      const fit1 =
        maxLength <= listing.length && sumLengths <= listing.length * lanes1;
      if (fit1) return true;
    }

    // Orientation 2: vehicles parallel to listing width
    const lanes2 = Math.floor(listing.length / vehicleWidth);
    if (lanes2 > 0) {
      const fit2 =
        maxLength <= listing.width && sumLengths <= listing.width * lanes2;
      if (fit2) return true;
    }

    return false;
  }
}
