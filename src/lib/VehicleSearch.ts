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
  constructor(private listings: Listing[]) {}

  find(requests: VehicleRequest[]): SearchResult[] {
    throw new Error("Algorithm not implemented");
  }
}
