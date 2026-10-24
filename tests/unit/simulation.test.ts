import { describe, expect, it } from "vitest";
import {
  ageAfter,
  createPrng,
  PriorityEventQueue,
  qualityAtAge,
  Simulation,
  VirtualClock,
} from "@/lib/domain/simulation";
import { evaluateSimulationPlan } from "@/lib/domain/feasibility";
const plan = {
  routeId: "primary-vashi",
  vehicleId: "standard-10t",
  vehicleCount: 1,
  quantityKg: 10000,
};
const run = (
  disruptions: ConstructorParameters<typeof Simulation>[0]["disruptions"] = []
) => {
  const sim = new Simulation({ plan, seed: 42, disruptions });
  sim.advanceTo(100);
  return sim;
};
describe("deterministic simulation", () => {
  it("completes normal, delayed and breakdown routes", () => {
    expect(run().virtualTime).toBe(6.5);
    const delay = run([
      {
        id: "delay",
        kind: "delay",
        durationHours: 10,
        trigger: { checkpoint: "igatpuri" },
      },
    ]);
    expect(delay.virtualTime).toBe(16.5);
    expect(delay.state.quality.effectiveAgeHours).toBe(16.5);
    const breakdown = run([
      {
        id: "failure",
        kind: "breakdown",
        durationHours: 24,
        trigger: { checkpoint: "nashik" },
      },
    ]);
    expect(breakdown.virtualTime).toBe(30.5);
    expect(breakdown.state.quality.effectiveAgeHours).toBe(54.5);
    expect(breakdown.state.location).toBe("vashi");
    expect(breakdown.state.finished).toBe(true);
    const history = breakdown.history;
    breakdown.advanceTo(200);
    expect(breakdown.history).toEqual(history);
  });
  it("produces identical serialized logs across 1,000 ticks with seed 42", () => {
    const execute = () => {
      const sim = new Simulation({
        plan,
        seed: 42,
        tickHours: 0.001,
        disruptionProbability: 1,
      });
      sim.advanceTo(1);
      expect(sim.history.filter((e) => e.type === "TRANSIT_TICK")).toHaveLength(
        1000
      );
      sim.advanceTo(100);
      return JSON.stringify({ history: sim.history, state: sim.state });
    };
    expect(execute()).toBe(execute());
  });
  it("is independent of clock advancement chunk sizes", () => {
    const options = { plan, seed: 42, disruptionProbability: 1 };
    const a = new Simulation(options),
      b = new Simulation(options);
    a.advanceTo(100);
    for (let time = 0; time <= 100; time += 0.125) b.advanceTo(time);
    expect(JSON.stringify(a.history)).toBe(JSON.stringify(b.history));
    expect(a.state).toEqual(b.state);
  });
  it("overlapping timed disruptions block travel only for their union", () => {
    const sim = run([
      { id: "a", kind: "breakdown", durationHours: 3, trigger: { time: 0.5 } },
      { id: "b", kind: "delay", durationHours: 4, trigger: { time: 1 } },
    ]);
    expect(sim.virtualTime).toBe(11);
    expect(sim.state.quality.effectiveAgeHours).toBe(14);
  });
  it("rejects infeasible bookings with explanatory codes", () => {
    const invalid = { ...plan, vehicleId: "reefer-van" };
    expect(evaluateSimulationPlan(invalid).rejections).toContainEqual({
      code: "CAPACITY_MISMATCH",
      message: expect.any(String),
    });
    expect(() => new Simulation({ plan: invalid, seed: 42 })).toThrow(
      "CAPACITY_MISMATCH"
    );
    expect(
      evaluateSimulationPlan({ ...invalid, vehicleCount: 4 }).isFeasible
    ).toBe(true);
    for (const quantityKg of [NaN, Infinity, -1, 0])
      expect(evaluateSimulationPlan({ ...plan, quantityKg }).isFeasible).toBe(
        false
      );
  });
  it("suppresses duplicate IDs before and after processing, and isolates callers", () => {
    const queue = new PriorityEventQueue();
    const event = { id: "tick", time: 1, type: "TRANSIT_TICK" as const };
    expect(queue.enqueue(event)).toBe(true);
    event.time = 99;
    expect(queue.enqueue(event)).toBe(false);
    expect(queue.dequeue()?.time).toBe(1);
    expect(queue.enqueue(event)).toBe(false);
    expect(queue.dequeue()).toBeUndefined();
    const sim = run();
    sim.history[0].time = 999;
    expect(sim.history[0].time).not.toBe(999);
    expect(new Set(sim.history.map((e) => e.id)).size).toBe(sim.history.length);
  });
  it("orders same-time events by priority then insertion order", () => {
    const queue = new PriorityEventQueue();
    queue.enqueue({ id: "tick", time: 1, type: "TRANSIT_TICK" });
    queue.enqueue({ id: "a", time: 1, type: "CHECKPOINT" });
    queue.enqueue({ id: "b", time: 1, type: "CHECKPOINT" });
    expect([
      queue.dequeue()?.id,
      queue.dequeue()?.id,
      queue.dequeue()?.id,
    ]).toEqual(["a", "b", "tick"]);
  });
  it("supports pause, playback acceleration and explicit stepping", () => {
    const sim = new Simulation({ plan, seed: 42 });
    sim.elapse(1);
    expect(sim.virtualTime).toBe(0);
    sim.setSpeed(3600);
    sim.play();
    sim.elapse(1);
    expect(sim.virtualTime).toBe(1);
    sim.pause();
    sim.elapse(1);
    expect(sim.virtualTime).toBe(1);
    expect(sim.step()).toBe(true);
    expect(sim.virtualTime).toBeGreaterThan(1);
    expect(() => sim.advanceTo(0)).toThrow();
    expect(() => sim.setSpeed(Infinity)).toThrow();
    const clock = new VirtualClock();
    clock.step(2);
    expect(clock.virtualTime).toBe(2);
  });
  it("has reproducible seeded randomness", () => {
    const a = createPrng(42),
      b = createPrng(42),
      c = createPrng(43);
    expect(a()).toBe(b());
    expect(a()).not.toBe(c());
    expect(() => createPrng(NaN)).toThrow();
  });
});
describe("registered temperature regimes and crop decay", () => {
  it.each([
    ["ambient", 24],
    ["ventilated", 18],
    ["cold", 7.2],
    ["stalled-hot", 48],
  ] as const)("ages at the %s profile rate", (environment, age) => {
    expect(ageAfter(24, environment)).toBeCloseTo(age);
    expect(qualityAtAge(age).referenceShelfLifeRemainingHours).toBeCloseTo(
      120 - age
    );
  });
  it("interpolates curve knots and respects the inclusive sale threshold", () => {
    expect(qualityAtAge(0).qualityFraction).toBe(0.96);
    expect(qualityAtAge(36).qualityFraction).toBeCloseTo(0.86);
    expect(qualityAtAge(120)).toMatchObject({
      grade: "C",
      saleableFraction: 0.65,
      referenceShelfLifeRemainingHours: 0,
    });
    expect(qualityAtAge(121)).toMatchObject({
      grade: "REJECT",
      saleableFraction: 0,
    });
    expect(qualityAtAge(300).qualityFraction).toBe(0);
    expect(() => qualityAtAge(-1)).toThrow();
  });
});
