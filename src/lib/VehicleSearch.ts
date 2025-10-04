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

interface SearchResult {
  location_id: string;
  listing_ids: string[];
  total_price_in_cents: number;
}

export class VehicleSearch {
  private locations: Record<string, Listing[]>;
  private canFitCache: Map<string, boolean>;

  constructor(listings: Listing[]) {
    this.locations = {};
    this.canFitCache = new Map();
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
    const candidatesPerSubset = vehicleSubsets.map((subset) =>
      listings
        .filter((listing) => this.canFit(subset, listing))
        .sort((a, b) => a.price_in_cents - b.price_in_cents)
    );

    if (candidatesPerSubset.some((candidates) => candidates.length === 0)) {
      return undefined;
    }

    let bestCombination: { price: number; listing_ids: string[] } | undefined;

    const solve = (
      subsetIndex: number,
      currentPrice: number,
      usedListingIds: Set<string>,
      currentListingIds: string[]
    ) => {
      if (subsetIndex === vehicleSubsets.length) {
        if (!bestCombination || currentPrice < bestCombination.price) {
          bestCombination = {
            price: currentPrice,
            listing_ids: currentListingIds,
          };
        }
        return;
      }

      if (bestCombination && currentPrice >= bestCombination.price) {
        return; // Pruning
      }

      for (const listing of candidatesPerSubset[subsetIndex]) {
        if (!usedListingIds.has(listing.id)) {
          usedListingIds.add(listing.id);
          solve(
            subsetIndex + 1,
            currentPrice + listing.price_in_cents,
            usedListingIds,
            [...currentListingIds, listing.id]
          );
          usedListingIds.delete(listing.id);
        }
      }
    };

    solve(0, 0, new Set(), []);

    return bestCombination;
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

    const normalized = [...vehicleLengths].sort((a, b) => b - a);
    const keyBase = `${listing.length}x${listing.width}:${normalized.join(',')}`;

    // Orientation 1 (parallel to listing length). Allowed if every vehicle fits unrotated.
    {
      const key = `${keyBase}:O1`;
      const cached = this.canFitCache.get(key);
      if (cached !== undefined) return cached;

      const lanes = Math.floor(listing.width / 10);
      const allFitIndividually = normalized.every((len) => len <= listing.length);
      let ok = false;
      if (lanes > 0 && allFitIndividually) {
        ok = this.canPackIntoLanes(normalized, lanes, listing.length);
      }
      this.canFitCache.set(key, ok);
      if (ok) return true;
    }

    // Orientation 2 (parallel to listing width). Enforce non-mixed policy: every vehicle must
    // require rotation to fit (i.e., be longer than listing.length), and also fit within listing.width.
    {
      const key = `${keyBase}:O2`;
      const cached = this.canFitCache.get(key);
      if (cached !== undefined) return cached;

      const lanes = Math.floor(listing.length / 10);
      const allRequireRotation = normalized.every((len) => len > listing.length);
      const allFitRotated = normalized.every((len) => len <= listing.width);
      let ok = false;
      if (lanes > 0 && allRequireRotation && allFitRotated) {
        ok = this.canPackIntoLanes(normalized, lanes, listing.width);
      }
      this.canFitCache.set(key, ok);
      if (ok) return true;
    }

    return false;
  }

  private canPackIntoLanes(
    items: number[],
    lanes: number,
    laneCapacity: number
  ): boolean {
    if (lanes <= 0) return false;
    if (items.length === 0) return true;
    if (Math.max(...items) > laneCapacity) return false;
    const total = items.reduce((a, b) => a + b, 0);
    if (total > lanes * laneCapacity) return false;

    const sorted = [...items].sort((a, b) => b - a);
    const capacities: number[] = Array(lanes).fill(laneCapacity);
    const memo = new Set<string>();

    const dfs = (index: number): boolean => {
      if (index === sorted.length) return true;
      const item = sorted[index]!;

      const key = `${index}:${capacities
        .slice()
        .sort((a, b) => b - a)
        .join('|')}`;
      if (memo.has(key)) return false;

      let lastTried = -1;
      for (let i = 0; i < capacities.length; i++) {
        const rem = capacities[i]!;
        if (rem === lastTried) continue;
        if (rem >= item) {
          capacities[i] = rem - item;
          if (dfs(index + 1)) return true;
          capacities[i] = rem;
          lastTried = rem;
        }
      }

      memo.add(key);
      return false;
    };

    return dfs(0);
  }
}
