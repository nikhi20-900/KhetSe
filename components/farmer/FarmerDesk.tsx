"use client";

import { useMemo, useState } from "react";

import { AlertBanner } from "@/components/ui/AlertBanner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import type {
  FarmerDesk as FarmerDeskModel,
  FarmerOffer,
} from "@/lib/domain/farmer-desk";
import { FARMER_CROPS } from "@/lib/domain/farmer-crops";
import {
  resolveBuyerResponse,
  validateFarmerPhoto,
} from "@/lib/domain/farmer-photo";
import { FARMER_REPLAYS, type FarmerReplay } from "@/lib/domain/farmer-replay";
import { formatModeledInr } from "@/lib/planning/format";

type Step = "crop" | "place" | "map" | "quote" | "photo" | "track" | "done";

function formatInr(value: number) {
  return formatModeledInr(value);
}

function formatPrice(value: number) {
  const amount = Number.isInteger(value)
    ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)
    : new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
  return `₹${amount}`;
}

function replayState(replay: FarmerReplay | null) {
  if (replay === "vashi-mandi" || replay === "pune-premium") {
    return {
      step: "quote" as const,
      selectedId: replay,
      disturbance: false,
    };
  }
  if (replay === "breakdown") {
    return {
      step: "track" as const,
      selectedId: "pune-premium",
      disturbance: true,
    };
  }
  return {
    step: "crop" as const,
    selectedId: null,
    disturbance: false,
  };
}

export function FarmerDesk({
  desk,
  replay = null,
  rejectedReplay = false,
}: {
  desk: FarmerDeskModel;
  replay?: FarmerReplay | null;
  rejectedReplay?: boolean;
}) {
  const initial = replayState(replay);
  const [cropId, setCropId] = useState("nashik-red-onion");
  const [step, setStep] = useState<Step>(initial.step);
  const [browserPlace, setBrowserPlace] = useState<string | null>(null);
  const [placeNote, setPlaceNote] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    initial.selectedId
  );
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [buyerAccepted, setBuyerAccepted] = useState<boolean | null>(null);
  const [buyerMessage, setBuyerMessage] = useState<string | null>(null);
  const [checkpoint, setCheckpoint] = useState(0);
  const [disturbance, setDisturbance] = useState(initial.disturbance);
  const crop =
    FARMER_CROPS.find((item) => item.id === cropId) ?? FARMER_CROPS[0];
  const selected = desk.offers.find((offer) => offer.id === selectedId) ?? null;
  const positions = useMemo(() => layout(desk), [desk]);

  function readBrowserPlace() {
    if (!navigator.geolocation) {
      setPlaceNote(
        "This browser has no location service. The model uses the registered farm gate."
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBrowserPlace(
          `${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`
        );
        setPlaceNote(
          "The browser location is context only. Freight and prices stay on the registered farm gate."
        );
      },
      () => {
        setPlaceNote(
          "Location permission was not granted. The model uses the registered farm gate."
        );
      }
    );
  }

  function choose(offer: FarmerOffer) {
    setSelectedId(offer.id);
    setPhotoName(null);
    setPhotoError(null);
    setBuyerAccepted(null);
    setBuyerMessage(null);
    setCheckpoint(0);
    setDisturbance(false);
    setStep("quote");
  }

  const replayLabel = FARMER_REPLAYS.find((item) => item.id === replay)?.label;

  return (
    <div className="space-y-6" data-record="preview" data-persisted="false">
      <PageHeader
        kicker="FARMER DESK · SIMULATED"
        title="Choose a harvest and a buyer"
        description="Pick the registered onion lot, see the demonstration mandis, and compare modeled freight, wastage, and net proceeds. A nearby mandi sale ends here. A premium buyer starts a separate cold-van preview."
        badge={<Badge tone="gray">SIMULATED</Badge>}
      />

      <AlertBanner tone="modeled" title="Preview, not a stored shipment">
        Choices on this desk stay in the browser. A generated report here is a
        modeled estimate. It does not create a reservation, shipment, or sale. A
        persisted shipment status is a different record on the shipment report.
      </AlertBanner>

      <Card header={<h2 className="font-semibold">Repeat a known preview</h2>}>
        <p className="text-sm text-charcoal-700">
          These addresses open the same modeled figures every time. They do not
          call the database reset, and they do not write a shipment.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {FARMER_REPLAYS.map((item) => (
            <Button key={item.id} href={item.href} variant="secondary">
              {item.label}
            </Button>
          ))}
          <Button href="/farmer" variant="secondary">
            Reset to crop choice
          </Button>
        </div>
        {replayLabel ? (
          <p className="mt-3 text-sm" role="status">
            Replaying {replayLabel}. Opening this address again shows the same
            modeled figures.
          </p>
        ) : null}
        {rejectedReplay ? (
          <p className="mt-3 text-sm" role="alert">
            That replay id is not registered. The desk opened at crop choice.
          </p>
        ) : null}
      </Card>

      {step === "crop" ? (
        <Card header={<h2 className="font-semibold">Harvest</h2>}>
          <div className="grid gap-3 sm:grid-cols-3">
            {FARMER_CROPS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`rounded-md border px-3 py-3 text-left text-sm ${
                  cropId === item.id
                    ? "border-terracotta bg-terracotta-50"
                    : "border-sand-300"
                }`}
                onClick={() => setCropId(item.id)}
              >
                <span className="block font-semibold">{item.name}</span>
                <span className="mt-1 block text-charcoal-600">
                  {item.note}
                </span>
              </button>
            ))}
          </div>
          <button
            className="mt-4 rounded-md bg-terracotta px-3.5 py-2 text-sm font-medium text-white disabled:opacity-50"
            type="button"
            disabled={!crop.supported}
            onClick={() => setStep("place")}
          >
            Continue with {crop.name}
          </button>
        </Card>
      ) : null}

      {step === "place" ? (
        <Card header={<h2 className="font-semibold">Location and weather</h2>}>
          <p className="text-sm text-charcoal-700">
            Registered farm gate: {desk.originName} ({desk.latitudeDeg},{" "}
            {desk.longitudeDeg}). Demonstration weather:{" "}
            {desk.weather.temperatureC}
            °C, {desk.weather.relativeHumidityPct}% relative humidity.{" "}
            {desk.weather.label}
          </p>
          <button
            className="mt-3 rounded-md border border-sand-400 px-3 py-2 text-sm"
            type="button"
            onClick={readBrowserPlace}
          >
            Read browser location
          </button>
          {browserPlace ? (
            <p className="mt-2 text-sm">Browser reported {browserPlace}.</p>
          ) : null}
          {placeNote ? <p className="mt-2 text-sm">{placeNote}</p> : null}
          <button
            className="mt-4 rounded-md bg-terracotta px-3.5 py-2 text-sm font-medium text-white"
            type="button"
            onClick={() => setStep("map")}
          >
            Show mandis and buyers
          </button>
        </Card>
      ) : null}

      {step === "map" || step === "quote" ? (
        <Card header={<h2 className="font-semibold">Mandis and buyers</h2>}>
          <DeskMap desk={desk} positions={positions} onChoose={choose} />
          <p className="mt-3 text-sm text-charcoal-600">
            Recommended mandi by modeled net proceeds:{" "}
            {
              desk.offers.find((offer) => offer.id === desk.recommendedMandiId)
                ?.name
            }
            . Prices are the baseline register, not a live mandi board.
          </p>
        </Card>
      ) : null}

      {step === "quote" && selected ? (
        <Quote
          offer={selected}
          recommended={selected.id === desk.recommendedMandiId}
          onNearby={() => setStep("done")}
          onPremium={() => setStep("photo")}
          onBack={() => setStep("map")}
        />
      ) : null}

      {step === "photo" && selected ? (
        <Card header={<h2 className="font-semibold">Quality photo</h2>}>
          <p className="text-sm text-charcoal-700">
            Attach a photo for the premium buyer preview. The file stays in this
            browser. The demonstration does not grade the picture.
          </p>
          <input
            className="mt-3 block text-sm"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              const validName = validateFarmerPhoto(file);
              setPhotoName(validName);
              setPhotoError(
                file && !validName
                  ? "Choose an image file for the premium buyer preview."
                  : null
              );
              setBuyerAccepted(null);
              setBuyerMessage(null);
            }}
          />
          {photoError ? (
            <p className="mt-2 text-sm" role="alert">
              {photoError}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-md bg-terracotta px-3.5 py-2 text-sm font-medium text-white disabled:opacity-50"
              type="button"
              disabled={!photoName}
              onClick={() => {
                const result = resolveBuyerResponse("accept", photoName);
                setBuyerAccepted(result.accepted);
                setBuyerMessage(result.message);
                setStep(result.step);
              }}
            >
              Buyer accepts the attachment
            </button>
            <button
              className="rounded-md border border-sand-400 px-3 py-2 text-sm"
              type="button"
              onClick={() => {
                const result = resolveBuyerResponse("decline", photoName);
                setBuyerAccepted(result.accepted);
                setBuyerMessage(result.message);
                setStep(result.step);
              }}
            >
              Buyer declines
            </button>
          </div>
          {buyerAccepted === false ? (
            <p className="mt-3 text-sm" role="alert">
              {buyerMessage} The mandi comparison is still available.
            </p>
          ) : null}
        </Card>
      ) : null}

      {step === "track" ? (
        <Tracking
          desk={desk}
          checkpoint={checkpoint}
          disturbance={disturbance}
          onAdvance={() =>
            setCheckpoint((current) =>
              Math.min(current + 1, desk.coldRoute.length - 1)
            )
          }
          onDisturb={() => setDisturbance(true)}
          onFinish={() => setStep("done")}
        />
      ) : null}

      {step === "done" && selected ? (
        <Card
          header={<h2 className="font-semibold">Modeled preview report</h2>}
        >
          <p className="text-sm font-medium text-charcoal-900">
            This report was generated in the browser. It is not a persisted
            shipment outcome.
          </p>
          <p className="mt-2 text-sm text-charcoal-800">
            {selected.kind === "premium-buyer"
              ? disturbance
                ? "The cold-van preview recorded a disturbance. The figures below are the modeled comparison, not a completed live delivery."
                : "The cold-van preview reached the last registered checkpoint. This is not a live delivery receipt."
              : "The mandi preview is complete. No cold van was assigned."}
          </p>
          <p className="mt-2 text-sm">
            {selected.name}: net {formatInr(selected.netProceedsInr)} after
            freight {formatInr(selected.freightInr)}, other costs{" "}
            {formatInr(selected.otherCostsInr)}, and {selected.wastageKg} kg not
            counted as saleable.
          </p>
          <p className="mt-2 text-sm text-charcoal-600">
            {desk.persistenceNote}
          </p>
          <div className="mt-4 border-t border-sand-300 pt-4">
            <h3 className="text-sm font-semibold text-charcoal-950">
              Recorded workflow, separate from this preview
            </h3>
            <p className="mt-2 text-sm text-charcoal-700">
              Harvest intake, reservations, and shipments are a different path.
              Opening them does not copy this net, freight, or wastage onto a
              stored shipment. Those screens use the planning catalog, which is
              a different tariff from this baseline quote.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button href="/harvests/new" variant="secondary">
                Open harvest intake
              </Button>
              <Button href="/" variant="secondary">
                Open the operations desk
              </Button>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function DeskMap({
  desk,
  positions,
  onChoose,
}: {
  desk: FarmerDeskModel;
  positions: Map<string, { x: number; y: number }>;
  onChoose: (offer: FarmerOffer) => void;
}) {
  const origin = positions.get("origin");
  return (
    <div className="relative h-80 rounded-lg border border-sand-300 bg-sand-50">
      <svg
        className="h-full w-full"
        viewBox="0 0 100 100"
        role="img"
        aria-label="Registered places"
      >
        {origin
          ? desk.offers.map((offer) => {
              const point = positions.get(offer.id);
              if (!point) return null;
              return (
                <line
                  key={offer.id}
                  x1={origin.x}
                  y1={origin.y}
                  x2={point.x}
                  y2={point.y}
                  stroke="#c4b8a8"
                  strokeWidth="0.6"
                />
              );
            })
          : null}
      </svg>
      {origin ? <Pin x={origin.x} y={origin.y} label="Farm gate" /> : null}
      {desk.offers.map((offer) => {
        const point = positions.get(offer.id);
        if (!point) return null;
        return (
          <button
            key={offer.id}
            type="button"
            className="absolute max-w-36 -translate-x-1/2 -translate-y-full rounded bg-charcoal px-2 py-1 text-left text-xs text-linen"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            onClick={() => onChoose(offer)}
          >
            {offer.name}
            <span className="block">{formatPrice(offer.priceInrPerKg)}/kg</span>
          </button>
        );
      })}
    </div>
  );
}

function Pin({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <span
      className="absolute -translate-x-1/2 -translate-y-1/2 rounded bg-terracotta px-2 py-1 text-xs text-white"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {label}
    </span>
  );
}

function layout(desk: FarmerDeskModel) {
  const points = [
    {
      id: "origin",
      latitudeDeg: desk.latitudeDeg,
      longitudeDeg: desk.longitudeDeg,
    },
    ...desk.offers.map((offer) => ({
      id: offer.id,
      latitudeDeg:
        offer.latitudeDeg + (offer.kind === "premium-buyer" ? 0.9 : 0),
      longitudeDeg: offer.longitudeDeg,
    })),
  ];
  const lats = points.map((point) => point.latitudeDeg);
  const lngs = points.map((point) => point.longitudeDeg);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const map = new Map<string, { x: number; y: number }>();
  for (const point of points) {
    const x =
      12 + ((point.longitudeDeg - minLng) / (maxLng - minLng || 1)) * 76;
    const y = 18 + ((maxLat - point.latitudeDeg) / (maxLat - minLat || 1)) * 64;
    map.set(point.id, { x, y });
  }
  return map;
}

function Quote({
  offer,
  recommended,
  onNearby,
  onPremium,
  onBack,
}: {
  offer: FarmerOffer;
  recommended: boolean;
  onNearby: () => void;
  onPremium: () => void;
  onBack: () => void;
}) {
  const margin =
    offer.netProceedsInr >= 0 ? "estimated net proceeds" : "estimated loss";
  return (
    <Card header={<h2 className="font-semibold">{offer.name}</h2>}>
      <p className="text-sm text-charcoal-700">
        {offer.basis}{" "}
        {recommended ? "This is the highest modeled mandi net." : ""} This quote
        is a preview. Finishing it does not reserve a truck.
      </p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>Price {formatPrice(offer.priceInrPerKg)}/kg</div>
        <div>
          Distance {offer.distanceKm} km · registered road time{" "}
          {offer.durationHours} h
        </div>
        <div>Saleable {offer.saleableKg} kg</div>
        <div>Wastage not sold {offer.wastageKg} kg</div>
        <div>Freight {formatInr(offer.freightInr)}</div>
        <div>Other costs {formatInr(offer.otherCostsInr)}</div>
        <div>Total cost {formatInr(offer.totalCostInr)}</div>
        <div>
          {margin} {formatInr(offer.netProceedsInr)}
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        {offer.kind === "premium-buyer" ? (
          <button
            className="rounded-md bg-terracotta px-3.5 py-2 text-sm font-medium text-white"
            type="button"
            onClick={onPremium}
          >
            Send to this buyer
          </button>
        ) : (
          <button
            className="rounded-md bg-terracotta px-3.5 py-2 text-sm font-medium text-white"
            type="button"
            onClick={onNearby}
          >
            Finish mandi preview
          </button>
        )}
        <button
          className="rounded-md border border-sand-400 px-3 py-2 text-sm"
          type="button"
          onClick={onBack}
        >
          Choose another place
        </button>
      </div>
    </Card>
  );
}

function Tracking({
  desk,
  checkpoint,
  disturbance,
  onAdvance,
  onDisturb,
  onFinish,
}: {
  desk: FarmerDeskModel;
  checkpoint: number;
  disturbance: boolean;
  onAdvance: () => void;
  onDisturb: () => void;
  onFinish: () => void;
}) {
  const current = desk.coldRoute[checkpoint];
  const finished = checkpoint >= desk.coldRoute.length - 1;
  return (
    <Card header={<h2 className="font-semibold">Cold-van checkpoints</h2>}>
      <p className="text-sm text-charcoal-700">
        These are registered route checkpoints. They are not a live GPS track.
      </p>
      <ol className="mt-3 space-y-2">
        {desk.coldRoute.map((point, index) => (
          <li
            key={`${point.label}-${point.hours}`}
            className={`rounded-md border px-3 py-2 text-sm ${
              index <= checkpoint
                ? "border-sage-600 bg-sage-50"
                : "border-sand-300"
            }`}
          >
            {point.label} · {point.hours.toFixed(2)} h
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm" role="status">
        Current checkpoint: {current?.label}. Simulated time{" "}
        {current?.hours.toFixed(2)} h.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="rounded-md bg-terracotta px-3.5 py-2 text-sm font-medium text-white disabled:opacity-50"
          type="button"
          disabled={finished || disturbance}
          onClick={onAdvance}
        >
          Advance checkpoint
        </button>
        <button
          className="rounded-md border border-sand-400 px-3 py-2 text-sm"
          type="button"
          disabled={disturbance}
          onClick={onDisturb}
        >
          Inject a breakdown
        </button>
        <button
          className="rounded-md border border-sand-400 px-3 py-2 text-sm"
          type="button"
          disabled={!finished && !disturbance}
          onClick={onFinish}
        >
          Generate report
        </button>
      </div>
      {disturbance ? (
        <div className="mt-4 space-y-2 text-sm">
          <p>{desk.disturbance.detail}</p>
          {desk.disturbance.alternatives.map((item) => (
            <p key={item.id}>
              {item.title}: net {formatInr(item.netProceedsInr)}, delta{" "}
              {formatInr(item.deltaInr)}. {item.note}
            </p>
          ))}
          <p>{desk.disturbance.recommendationNote}</p>
        </div>
      ) : null}
    </Card>
  );
}
