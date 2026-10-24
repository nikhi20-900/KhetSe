import baseline from "@/data/demo-baseline.json";
import { evaluateSimulationPlan, type SimulationPlan } from "./feasibility";

/** All simulation times and durations are hours relative to dispatch. */
export class VirtualClock {
  private time = 0;
  private scale = 1;
  get virtualTime() {
    return this.time;
  }
  get timeScale() {
    return this.scale;
  }
  setSpeed(scale: number) {
    nonnegative(scale, "timeScale");
    this.scale = scale;
  }
  advanceTo(time: number) {
    nonnegative(time, "virtualTime");
    if (time < this.time)
      throw new Error("Virtual time cannot move backwards.");
    this.time = time;
  }
  step(hours = 1) {
    nonnegative(hours, "step");
    this.advanceTo(this.time + hours);
  }
}

function nonnegative(value: number, name: string) {
  if (!Number.isFinite(value) || value < 0)
    throw new Error(`${name} must be finite and nonnegative.`);
}

/** Mulberry32; never consults wall time or Math.random. */
export function createPrng(seed: number) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw new Error("Seed must be a uint32.");
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export type EnvironmentId = "ambient" | "ventilated" | "cold" | "stalled-hot";
export function ageAfter(
  elapsedHours: number,
  environment: EnvironmentId,
  initialAge = 0
) {
  nonnegative(elapsedHours, "elapsedHours");
  nonnegative(initialAge, "initialAge");
  const profile = baseline.environments.find((item) => item.id === environment);
  if (!profile) throw new Error("Unknown environment.");
  return initialAge + elapsedHours * profile.ageMultiplier;
}

/** Piecewise-linear SIM-001 curve; temperature labels do not imply a biological formula. */
export function qualityAtAge(effectiveAgeHours: number) {
  nonnegative(effectiveAgeHours, "effectiveAgeHours");
  const curve = baseline.crop.qualityCurve;
  let qualityFraction = 0;
  let saleableFraction = 0;
  for (let i = 1; i < curve.length; i++) {
    const left = curve[i - 1],
      right = curve[i];
    if (effectiveAgeHours <= right.effectiveAgeHours) {
      const fraction =
        (effectiveAgeHours - left.effectiveAgeHours) /
        (right.effectiveAgeHours - left.effectiveAgeHours);
      qualityFraction =
        left.qualityFraction +
        fraction * (right.qualityFraction - left.qualityFraction);
      saleableFraction =
        left.saleableFraction +
        fraction * (right.saleableFraction - left.saleableFraction);
      break;
    }
  }
  const grade = baseline.crop.grades.find(
    (item) => qualityFraction >= item.minimumQualityFraction
  )!.id;
  return {
    effectiveAgeHours,
    qualityFraction,
    saleableFraction: grade === "REJECT" ? 0 : saleableFraction,
    grade,
    referenceShelfLifeRemainingHours: Math.max(
      0,
      baseline.crop.referenceShelfLifeHours - effectiveAgeHours
    ),
  };
}

export interface ScheduledEvent {
  id: string;
  time: number;
  type:
    "DISRUPTION" | "RESUME" | "CHECKPOINT" | "TRANSIT_TICK" | "QUALITY_DECAY";
  checkpoint?: string;
  disruption?: Disruption;
}
const priority = {
  DISRUPTION: 0,
  RESUME: 1,
  CHECKPOINT: 2,
  TRANSIT_TICK: 3,
  QUALITY_DECAY: 4,
};

/** Stable FIFO tie-breaks within time and type; IDs remain reserved after dequeue. */
export class PriorityEventQueue {
  private entries: { event: ScheduledEvent; order: number }[] = [];
  private ids = new Set<string>();
  enqueue(event: ScheduledEvent): boolean {
    if (this.ids.has(event.id)) return false;
    nonnegative(event.time, "event time");
    if (!event.id) throw new Error("Event ID is required.");
    this.ids.add(event.id);
    this.entries.push({ event: structuredClone(event), order: this.ids.size });
    this.sort();
    return true;
  }
  private sort() {
    this.entries.sort(
      (a, b) =>
        a.event.time - b.event.time ||
        priority[a.event.type] - priority[b.event.type] ||
        a.order - b.order
    );
  }
  peek() {
    return this.entries[0] ? structuredClone(this.entries[0].event) : undefined;
  }
  dequeue() {
    return this.entries.shift()?.event;
  }
  delayCheckpoints(hours: number) {
    nonnegative(hours, "delay");
    for (const entry of this.entries)
      if (entry.event.type === "CHECKPOINT") entry.event.time += hours;
    this.sort();
  }
}

export interface Disruption {
  id: string;
  kind: "delay" | "breakdown";
  durationHours: number;
  trigger: { time: number } | { checkpoint: string };
}
export interface SimulationOptions {
  plan: SimulationPlan;
  seed: number;
  tickHours?: number;
  disruptions?: Disruption[];
  /** Optional seeded disruption at each intermediate checkpoint. Default: disabled. */
  disruptionProbability?: number;
}

export class Simulation {
  private clock = new VirtualClock();
  private queue = new PriorityEventQueue();
  private random: () => number;
  private options: SimulationOptions;
  private pending: Disruption[];
  private active = new Map<string, Disruption>();
  private tick = 0;
  private records: Array<
    ScheduledEvent & { quality: ReturnType<typeof qualityAtAge> }
  > = [];
  private environment: EnvironmentId;
  private vehicleEnvironment: EnvironmentId;
  private ageAnchor = 0;
  private timeAnchor = 0;
  private blockedUntil = 0;
  private finished = false;
  private location = baseline.crop.originNodeId;
  private playing = false;
  private tickHours: number;

  constructor(options: SimulationOptions) {
    const evaluation = evaluateSimulationPlan(options.plan);
    if (!evaluation.isFeasible)
      throw new Error(
        evaluation.rejections.map((r) => `${r.code}: ${r.message}`).join("; ")
      );
    this.options = structuredClone(options);
    this.random = createPrng(options.seed);
    this.tickHours = options.tickHours ?? 1 / 60;
    if (!Number.isFinite(this.tickHours) || this.tickHours < 1 / 3600)
      throw new Error("Ticks must be at least one simulated second.");
    const probability = options.disruptionProbability ?? 0;
    if (!Number.isFinite(probability) || probability < 0 || probability > 1)
      throw new Error("Invalid disruption probability.");
    const route = baseline.routes.find((r) => r.id === options.plan.routeId)!;
    const edges = route.edgeIds.map((id) =>
      baseline.edges.find((e) => e.id === id)!
    );
    this.pending = structuredClone(options.disruptions ?? []);
    const ids = new Set<string>();
    for (const disruption of this.pending) {
      if (!disruption.id || ids.has(disruption.id))
        throw new Error("Disruption IDs must be unique.");
      ids.add(disruption.id);
      nonnegative(disruption.durationHours, "durationHours");
      if ("time" in disruption.trigger)
        nonnegative(disruption.trigger.time, "trigger time");
      else if (
        !edges
          .slice(0, -1)
          .some(
            (edge) =>
              edge.to ===
              (disruption.trigger as { checkpoint: string }).checkpoint
          )
      )
        throw new Error(
          "Disruptions require an intermediate route checkpoint."
        );
    }
    this.vehicleEnvironment = baseline.vehicles.find(
      (v) => v.id === options.plan.vehicleId
    )!.environmentId as EnvironmentId;
    this.environment = this.vehicleEnvironment;
    let time = 0;
    for (const edge of edges) {
      time += edge.durationHours;
      this.queue.enqueue({
        id: `checkpoint:${edge.id}`,
        time,
        type: "CHECKPOINT",
        checkpoint: edge.to,
      });
    }
    for (const disruption of this.pending)
      if ("time" in disruption.trigger)
        this.scheduleDisruption(disruption, disruption.trigger.time);
    this.scheduleTick();
  }
  get virtualTime() {
    return this.clock.virtualTime;
  }
  get timeScale() {
    return this.clock.timeScale;
  }
  get history() {
    return structuredClone(this.records);
  }
  get state() {
    return {
      virtualTime: this.virtualTime,
      location: this.location,
      finished: this.finished,
      paused: !this.playing,
      environment: this.environment,
      quality: qualityAtAge(this.currentAge()),
    };
  }
  private currentAge() {
    return ageAfter(
      this.virtualTime - this.timeAnchor,
      this.environment,
      this.ageAnchor
    );
  }
  private changeEnvironment() {
    this.ageAnchor = this.currentAge();
    this.timeAnchor = this.virtualTime;
    this.environment = [...this.active.values()].some(
      (d) => d.kind === "breakdown"
    )
      ? "stalled-hot"
      : this.vehicleEnvironment;
  }
  play() {
    if (!this.finished) this.playing = true;
  }
  pause() {
    this.playing = false;
  }
  setSpeed(scale: number) {
    this.clock.setSpeed(scale);
  }
  /** UI supplies elapsed seconds; the domain has no timers. */
  elapse(seconds: number) {
    nonnegative(seconds, "seconds");
    if (this.playing)
      this.advanceTo(this.virtualTime + (seconds * this.timeScale) / 3600);
  }
  private scheduleDisruption(disruption: Disruption, time: number) {
    this.queue.enqueue({
      id: `disruption:${disruption.id}`,
      time,
      type: "DISRUPTION",
      disruption,
    });
  }
  private scheduleTick() {
    this.tick++;
    this.queue.enqueue({
      id: `tick:${this.tick}`,
      time: this.tick * this.tickHours,
      type: "TRANSIT_TICK",
    });
  }
  step(): boolean {
    if (this.finished) return false;
    const event = this.queue.dequeue();
    if (!event) return false;
    this.clock.advanceTo(event.time);
    if (event.type === "DISRUPTION") {
      const disruption = event.disruption!;
      const end = event.time + disruption.durationHours;
      this.queue.delayCheckpoints(
        Math.max(0, end - Math.max(event.time, this.blockedUntil))
      );
      this.blockedUntil = Math.max(this.blockedUntil, end);
      this.active.set(disruption.id, disruption);
      this.changeEnvironment();
      this.queue.enqueue({
        id: `resume:${disruption.id}`,
        time: end,
        type: "RESUME",
        disruption,
      });
    } else if (event.type === "RESUME") {
      this.active.delete(event.disruption!.id);
      this.changeEnvironment();
    } else if (event.type === "CHECKPOINT") {
      this.location = event.checkpoint!;
      const route = baseline.routes.find(
        (r) => r.id === this.options.plan.routeId
      )!;
      const lastEdge = baseline.edges.find(
        (e) => e.id === route.edgeIds.at(-1)
      )!;
      if (this.location === lastEdge.to) {
        this.finished = true;
        this.pause();
      } else {
        for (const disruption of this.pending)
          if (
            "checkpoint" in disruption.trigger &&
            disruption.trigger.checkpoint === this.location
          )
            this.scheduleDisruption(disruption, this.virtualTime);
        if (this.random() < (this.options.disruptionProbability ?? 0))
          this.scheduleDisruption(
            {
              id: `generated:${event.id}`,
              kind: this.random() < 0.5 ? "delay" : "breakdown",
              durationHours: 1 + Math.floor(this.random() * 12),
              trigger: { checkpoint: this.location },
            },
            this.virtualTime
          );
      }
    } else if (event.type === "TRANSIT_TICK") {
      this.queue.enqueue({
        id: `quality:${event.id}`,
        time: event.time,
        type: "QUALITY_DECAY",
      });
      this.scheduleTick();
    }
    this.records.push({ ...event, quality: qualityAtAge(this.currentAge()) });
    return true;
  }
  advanceTo(time: number) {
    nonnegative(time, "virtualTime");
    if (time < this.virtualTime)
      throw new Error("Virtual time cannot move backwards.");
    while (
      !this.finished &&
      this.queue.peek() &&
      this.queue.peek()!.time <= time
    )
      this.step();
    if (!this.finished) this.clock.advanceTo(time);
  }
}
