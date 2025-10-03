import {
  VehicleSearch,
  Listing,
  VehicleRequest,
} from "../src/lib/VehicleSearch";

const listings: Listing[] = [
  // Location A
  {
    id: "a1",
    location_id: "A",
    length: 20,
    width: 10,
    price_in_cents: 100,
  },
  {
    id: "a2",
    location_id: "A",
    length: 20,
    width: 10,
    price_in_cents: 110,
  },
  {
    id: "a3",
    location_id: "A",
    length: 50,
    width: 10,
    price_in_cents: 200,
  },

  // Location B
  {
    id: "b1",
    location_id: "B",
    length: 20,
    width: 20,
    price_in_cents: 200,
  },
  {
    id: "b2",
    location_id: "B",
    length: 30,
    width: 10,
    price_in_cents: 150,
  },

  // Location C
  {
    id: "c1",
    location_id: "C",
    length: 100,
    width: 10,
    price_in_cents: 500,
  },
];

describe("VehicleSearch", () => {
  it("should find the cheapest listing for a single vehicle", () => {
    const request: VehicleRequest[] = [{ length: 20, quantity: 1 }];
    const search = new VehicleSearch(listings);
    const result = search.find(request);
    expect(result).toEqual([
      {
        location_id: "A",
        listing_ids: ["a1"],
        total_price_in_cents: 100,
      },
      {
        location_id: "B",
        listing_ids: ["b2"],
        total_price_in_cents: 150,
      },
      {
        location_id: "C",
        listing_ids: ["c1"],
        total_price_in_cents: 500,
      },
    ]);
  });

  it("should return an empty array if no listings are provided", () => {
    const request: VehicleRequest[] = [{ length: 20, quantity: 1 }];
    const search = new VehicleSearch([]);
    const result = search.find(request);
    expect(result).toEqual([]);
  });

  it("should return an empty array if no listing can fit the vehicle", () => {
    const request: VehicleRequest[] = [{ length: 120, quantity: 1 }];
    const search = new VehicleSearch(listings);
    const result = search.find(request);
    expect(result).toEqual([]);
  });

  it("should handle a request for multiple vehicles of the same size", () => {
    const request: VehicleRequest[] = [{ length: 20, quantity: 2 }];
    const search = new VehicleSearch(listings);
    const result = search.find(request);
    expect(result).toEqual([
      {
        location_id: "A",
        listing_ids: ["a1", "a2"],
        total_price_in_cents: 210,
      },
      {
        location_id: "B",
        listing_ids: ["b1"],
        total_price_in_cents: 200,
      },
      {
        location_id: "C",
        listing_ids: ["c1"],
        total_price_in_cents: 500,
      },
    ]);
  });

  it("should handle a request for multiple vehicles of different sizes", () => {
    const request: VehicleRequest[] = [
      { length: 20, quantity: 1 },
      { length: 30, quantity: 1 },
    ];
    const search = new VehicleSearch(listings);
    const result = search.find(request);
    expect(result).toEqual([
      {
        location_id: "A",
        listing_ids: ["a3"],
        total_price_in_cents: 200,
      },
      {
        location_id: "B",
        listing_ids: ["b1", "b2"],
        total_price_in_cents: 350,
      },
      {
        location_id: "C",
        listing_ids: ["c1"],
        total_price_in_cents: 500,
      },
    ]);
  });

  it("should find the cheapest combination of listings at a single location", () => {
    const moreListings = [
      ...listings,
      {
        id: "a4",
        location_id: "A",
        length: 20,
        width: 10,
        price_in_cents: 90,
      },
    ];
    const request: VehicleRequest[] = [{ length: 20, quantity: 2 }];
    const search = new VehicleSearch(moreListings);
    const result = search.find(request);
    expect(result).toContainEqual({
      location_id: "A",
      listing_ids: ["a4", "a1"],
      total_price_in_cents: 190,
    });
  });

  it("should return multiple locations sorted by price", () => {
    const request: VehicleRequest[] = [{ length: 20, quantity: 1 }];
    const search = new VehicleSearch(listings);
    const result = search.find(request);
    expect(result.map((r) => r.total_price_in_cents)).toEqual([100, 150, 500]);
  });

  it("should return only one result per location (the cheapest)", () => {
    const request: VehicleRequest[] = [{ length: 20, quantity: 1 }];
    const search = new VehicleSearch(listings);
    const result = search.find(request);
    const locationIds = result.map((r) => r.location_id);
    expect(new Set(locationIds).size).toBe(locationIds.length);
  });
});
