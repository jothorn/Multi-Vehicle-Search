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
        listing_ids: ["a3"],
        total_price_in_cents: 200,
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
      listing_ids: ["a1", "a4"],
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

  it("returns [] for empty request", () => {
    const search = new VehicleSearch(listings);
    const result = search.find([]);
    expect(result).toEqual([]);
  });

  it("packs 3 vehicles into a single 20x40 listing using two width lanes", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "L1", location_id: loc, length: 40, width: 20, price_in_cents: 300 },
    ];
    const req: VehicleRequest[] = [{ length: 20, quantity: 3 }];
    const result = new VehicleSearch(l).find(req);
    expect(result).toEqual([
      { location_id: loc, listing_ids: ["L1"], total_price_in_cents: 300 },
    ]);
  });

  it("avoids greedy trap, chooses cheaper two-listing combo over one big listing", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "S1", location_id: loc, length: 30, width: 10, price_in_cents: 90 },
      { id: "S2", location_id: loc, length: 20, width: 10, price_in_cents: 100 },
      { id: "B", location_id: loc, length: 50, width: 10, price_in_cents: 210 },
    ];
    const req: VehicleRequest[] = [
      { length: 30, quantity: 1 },
      { length: 20, quantity: 1 },
    ];
    const result = new VehicleSearch(l).find(req);
    expect(result).toContainEqual({
      location_id: loc,
      listing_ids: expect.arrayContaining(["S1", "S2"]),
      total_price_in_cents: 190,
    });
  });

  it("handles duplicates and boundary sum=5", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "A", location_id: loc, length: 50, width: 20, price_in_cents: 400 },
    ];
    const req: VehicleRequest[] = [
      { length: 10, quantity: 3 },
      { length: 20, quantity: 2 },
    ];
    const result = new VehicleSearch(l).find(req);
    expect(result).toEqual([
      { location_id: loc, listing_ids: ["A"], total_price_in_cents: 400 },
    ]);
  });

  it("returns one result per location even with tie combos", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "X", location_id: loc, length: 20, width: 10, price_in_cents: 100 },
      { id: "Y", location_id: loc, length: 20, width: 10, price_in_cents: 100 },
    ];
    const req: VehicleRequest[] = [{ length: 20, quantity: 1 }];
    const results = new VehicleSearch(l).find(req);
    const sameLoc = results.filter((r) => r.location_id === loc);
    expect(sameLoc).toHaveLength(1);
    expect(sameLoc[0].total_price_in_cents).toBe(100);
  });

  it("uses a single listing id when one listing holds multiple vehicles", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "W", location_id: loc, length: 40, width: 10, price_in_cents: 150 },
    ];
    const req: VehicleRequest[] = [{ length: 20, quantity: 2 }];
    const [res] = new VehicleSearch(l).find(req);
    expect(res.listing_ids).toEqual(["W"]);
  });

  it("handles vehicle rotation when it only fits rotated (30x10 vehicle in 10x30 listing)", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "R1", location_id: loc, length: 10, width: 30, price_in_cents: 200 },
    ];
    const req: VehicleRequest[] = [{ length: 30, quantity: 1 }];
    const result = new VehicleSearch(l).find(req);
    expect(result).toEqual([
      { location_id: loc, listing_ids: ["R1"], total_price_in_cents: 200 },
    ]);
  });

  it("chooses the better orientation when vehicle fits both ways", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "SQ", location_id: loc, length: 20, width: 20, price_in_cents: 300 },
    ];
    const req: VehicleRequest[] = [{ length: 20, quantity: 1 }];
    const result = new VehicleSearch(l).find(req);
    expect(result).toEqual([
      { location_id: loc, listing_ids: ["SQ"], total_price_in_cents: 300 },
    ]);
  });

  it("packs vehicles using both orientations in different listings", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "L1", location_id: loc, length: 30, width: 10, price_in_cents: 100 },
      { id: "L2", location_id: loc, length: 10, width: 20, price_in_cents: 150 },
    ];
    const req: VehicleRequest[] = [
      { length: 30, quantity: 1 },
      { length: 20, quantity: 1 },
    ];
    const result = new VehicleSearch(l).find(req);
    expect(result).toEqual([
      {
        location_id: loc,
        listing_ids: expect.arrayContaining(["L1", "L2"]),
        total_price_in_cents: 250,
      },
    ]);
  });

  it("handles quantity zero in request (should ignore that entry)", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "Z", location_id: loc, length: 20, width: 10, price_in_cents: 100 },
    ];
    const req: VehicleRequest[] = [
      { length: 10, quantity: 0 },
      { length: 20, quantity: 1 },
    ];
    const result = new VehicleSearch(l).find(req);
    expect(result).toEqual([
      { location_id: loc, listing_ids: ["Z"], total_price_in_cents: 100 },
    ]);
  });

  it("handles listing with zero price", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "FREE", location_id: loc, length: 20, width: 10, price_in_cents: 0 },
      { id: "PAID", location_id: loc, length: 20, width: 10, price_in_cents: 100 },
    ];
    const req: VehicleRequest[] = [{ length: 20, quantity: 1 }];
    const result = new VehicleSearch(l).find(req);
    expect(result).toEqual([
      { location_id: loc, listing_ids: ["FREE"], total_price_in_cents: 0 },
    ]);
  });

  it("handles exact fit scenarios (vehicle dimensions match listing exactly)", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "EXACT", location_id: loc, length: 20, width: 10, price_in_cents: 100 },
    ];
    const req: VehicleRequest[] = [{ length: 20, quantity: 1 }];
    const result = new VehicleSearch(l).find(req);
    expect(result).toEqual([
      { location_id: loc, listing_ids: ["EXACT"], total_price_in_cents: 100 },
    ]);
  });

  it("ensures listings aren't double-counted (same listing used for capacity it has)", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "BIG", location_id: loc, length: 60, width: 20, price_in_cents: 300 },
    ];
    const req: VehicleRequest[] = [{ length: 20, quantity: 5 }];
    const result = new VehicleSearch(l).find(req);
    expect(result).toEqual([
      { location_id: loc, listing_ids: ["BIG"], total_price_in_cents: 300 },
    ]);
  });

  it("correctly handles complex 2D packing with different vehicle sizes", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "WIDE", location_id: loc, length: 30, width: 30, price_in_cents: 500 },
    ];
    const req: VehicleRequest[] = [
      { length: 10, quantity: 2 },
      { length: 30, quantity: 1 },
    ];
    const result = new VehicleSearch(l).find(req);
    expect(result).toEqual([
      { location_id: loc, listing_ids: ["WIDE"], total_price_in_cents: 500 },
    ]);
  });

  it("handles multiple different combinations with same total price (deterministic result)", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "A1", location_id: loc, length: 20, width: 10, price_in_cents: 50 },
      { id: "A2", location_id: loc, length: 20, width: 10, price_in_cents: 50 },
      { id: "B1", location_id: loc, length: 20, width: 20, price_in_cents: 100 },
    ];
    const req: VehicleRequest[] = [{ length: 20, quantity: 2 }];
    const result = new VehicleSearch(l).find(req);
    expect(result).toHaveLength(1);
    expect(result[0].location_id).toBe(loc);
    expect(result[0].total_price_in_cents).toBe(100);
  });

  it("rejects location when only some but not all vehicles fit", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "SMALL", location_id: loc, length: 20, width: 10, price_in_cents: 100 },
    ];
    const req: VehicleRequest[] = [
      { length: 20, quantity: 1 },
      { length: 50, quantity: 1 },
    ];
    const result = new VehicleSearch(l).find(req);
    expect(result).toEqual([]);
  });

  it("handles vehicles that can nest in width but not length", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "TALL", location_id: loc, length: 20, width: 40, price_in_cents: 400 },
    ];
    const req: VehicleRequest[] = [{ length: 20, quantity: 4 }];
    const result = new VehicleSearch(l).find(req);
    expect(result).toEqual([
      { location_id: loc, listing_ids: ["TALL"], total_price_in_cents: 400 },
    ]);
  });

  it("handles minimum vehicle size (10x10)", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "MIN", location_id: loc, length: 10, width: 10, price_in_cents: 50 },
    ];
    const req: VehicleRequest[] = [{ length: 10, quantity: 1 }];
    const result = new VehicleSearch(l).find(req);
    expect(result).toEqual([
      { location_id: loc, listing_ids: ["MIN"], total_price_in_cents: 50 },
    ]);
  });

  it("chooses optimal combination over suboptimal with greedy larger listing first", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "HUGE", location_id: loc, length: 100, width: 10, price_in_cents: 500 },
      { id: "S1", location_id: loc, length: 10, width: 10, price_in_cents: 40 },
      { id: "S2", location_id: loc, length: 10, width: 10, price_in_cents: 45 },
    ];
    const req: VehicleRequest[] = [{ length: 10, quantity: 2 }];
    const result = new VehicleSearch(l).find(req);
    expect(result[0].total_price_in_cents).toBe(85);
    expect(result[0].listing_ids).toEqual(expect.arrayContaining(["S1", "S2"]));
  });

  it("handles asymmetric packing where rotation enables better solution", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "H", location_id: loc, length: 10, width: 50, price_in_cents: 200 },
      { id: "V", location_id: loc, length: 50, width: 10, price_in_cents: 300 },
    ];
    const req: VehicleRequest[] = [{ length: 50, quantity: 1 }];
    const result = new VehicleSearch(l).find(req);
    // Should return only the cheapest option per location (requirement: "Include only one result per location_id")
    expect(result).toEqual([{
      location_id: loc,
      listing_ids: ["H"],
      total_price_in_cents: 200,
    }]);
  });

  it("handles multiple listings needed where single large listing insufficient in one dimension", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "LONG", location_id: loc, length: 100, width: 10, price_in_cents: 500 },
      { id: "WIDE", location_id: loc, length: 50, width: 30, price_in_cents: 600 },
    ];
    const req: VehicleRequest[] = [{ length: 50, quantity: 3 }];
    const result = new VehicleSearch(l).find(req);
    expect(result).toContainEqual({
      location_id: loc,
      listing_ids: ["WIDE"],
      total_price_in_cents: 600,
    });
  });

  it("uses three small listings instead of one big expensive listing", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "S1", location_id: loc, length: 20, width: 10, price_in_cents: 40 },
      { id: "S2", location_id: loc, length: 20, width: 10, price_in_cents: 50 },
      { id: "S3", location_id: loc, length: 20, width: 10, price_in_cents: 60 },
      { id: "BIG", location_id: loc, length: 60, width: 10, price_in_cents: 160 },
    ];
    const req: VehicleRequest[] = [{ length: 20, quantity: 3 }];
    const [res] = new VehicleSearch(l).find(req);
    expect(res.location_id).toBe(loc);
    expect(res.total_price_in_cents).toBe(150);
    expect(res.listing_ids).toEqual(expect.arrayContaining(["S1", "S2", "S3"]));
  });

  it("should fail when lane capacity is exceeded by individual vehicles", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "L1", location_id: loc, length: 30, width: 20, price_in_cents: 100 },
    ];
    // The listing provides two 30ft lanes. The request is for three 20ft vehicles.
    // Only one 20ft vehicle can fit in each 30ft lane, so only two vehicles fit.
    const req: VehicleRequest[] = [{ length: 20, quantity: 3 }];
    const result = new VehicleSearch(l).find(req);
    // The correct behavior is to find no solution.
    expect(result).toEqual([]);
  });

  it("rejects multi-vehicle packing that exceeds individual lane capacities", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "L1", location_id: loc, length: 50, width: 20, price_in_cents: 100 },
    ];
    // The listing provides two 50ft lanes.
    // The request is for vehicles of lengths [30, 30, 30, 10]. Sum is 100.
    // These cannot be packed: e.g., Lane 1: 30+10=40. Lane 2: 30. The third 30ft vehicle does not fit.
    const req: VehicleRequest[] = [
      { length: 30, quantity: 3 },
      { length: 10, quantity: 1 },
    ];
    const result = new VehicleSearch(l).find(req);
    // The correct behavior is to find no solution.
    expect(result).toEqual([]);
  });

  it("does not mix orientations within a listing (forces two listings instead of one mixed)", () => {
    const loc = "L";
    const l: Listing[] = [
      { id: "MIX", location_id: loc, length: 20, width: 30, price_in_cents: 150 },
      { id: "L30", location_id: loc, length: 30, width: 10, price_in_cents: 90 },
      { id: "L20", location_id: loc, length: 20, width: 10, price_in_cents: 80 },
    ];
    const req: VehicleRequest[] = [{ length: 30, quantity: 1 }, { length: 20, quantity: 1 }];
    const result = new VehicleSearch(l).find(req);
    // If mixing were allowed, "MIX" (150) would be cheaper; correct is 90+80=170 with two listings
    expect(result).toEqual([
      {
        location_id: loc,
        listing_ids: expect.arrayContaining(["L30", "L20"]),
        total_price_in_cents: 170,
      },
    ]);
  });

  it("packs multiple rotated vehicles in one short-wide listing", () => {
    const loc = "L";
    const l: Listing[] = [{ id: "W", location_id: loc, length: 10, width: 100, price_in_cents: 200 }];
    const req: VehicleRequest[] = [{ length: 50, quantity: 2 }];
    const result = new VehicleSearch(l).find(req);
    expect(result).toEqual([
      { location_id: loc, listing_ids: ["W"], total_price_in_cents: 200 },
    ]);
  });

  it("rejects packing when rotated widths exceed listing width", () => {
    const loc = "L";
    const l: Listing[] = [{ id: "W", location_id: loc, length: 10, width: 50, price_in_cents: 200 }];
    const req: VehicleRequest[] = [{ length: 30, quantity: 2 }]; // width needed = 60 > 50
    const result = new VehicleSearch(l).find(req);
    expect(result).toEqual([]);
  });

  it("aggregates duplicate lines for the same vehicle size", () => {
    const loc = "L";
    const l: Listing[] = [{ id: "BIG", location_id: loc, length: 60, width: 10, price_in_cents: 120 }];
    const req: VehicleRequest[] = [{ length: 20, quantity: 1 }, { length: 20, quantity: 2 }];
    const result = new VehicleSearch(l).find(req);
    expect(result).toEqual([
      { location_id: loc, listing_ids: ["BIG"], total_price_in_cents: 120 },
    ]);
  });
});
