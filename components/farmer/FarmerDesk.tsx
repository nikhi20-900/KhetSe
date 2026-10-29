"use client";

import { useMemo, useState } from "react";

import { AlertBanner } from "@/components/ui/AlertBanner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  BREAKDOWN_INJECT_NOTE,
  canInjectBreakdown,
} from "@/lib/domain/breakdown-control";
import type {
  FarmerAlternative,
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

const JOURNEY: Array<{ id: Step; label: string }> = [
  { id: "crop", label: "Harvest" },
  { id: "place", label: "Place" },
  { id: "map", label: "Mandis" },
  { id: "quote", label: "Quote" },
  { id: "done", label: "Report" },
];

function visibleJourney(step: Step) {
  if (step === "photo" || step === "track") {
    return [
      ...JOURNEY.slice(0, 4),
      { id: "photo" as const, label: "Photo" },
      { id: "track" as const, label: "Cold van" },
      JOURNEY[4],
    ];
  }
  return JOURNEY;
}

function StepRail({ step }: { step: Step }) {
  const items = visibleJourney(step);
  const current = Math.max(
    0,
    items.findIndex((item) => item.id === step)
  );
  return (
    <ol aria-label="Farmer desk progress" className="flex flex-wrap gap-2">
      {items.map((item, index) => {
        const active = index === current;
        const complete = index < current;
        return (
          <li
            key={item.id}
            aria-current={active ? "step" : undefined}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              active
                ? "bg-terracotta-700 text-white"
                : complete
                  ? "bg-sage-100 text-sage-900"
                  : "bg-sand-100 text-charcoal-700"
            }`}
          >
            {index + 1}. {item.label}
          </li>
        );
      })}
    </ol>
  );
}

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-md border border-sand-300 bg-sand-50 px-3 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-charcoal-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-charcoal-950">
        {value}
      </div>
      {detail ? (
        <div className="mt-1 text-xs leading-relaxed text-charcoal-600">
          {detail}
        </div>
      ) : null}
    </div>
  );
}

function QuoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-baseline sm:justify-between">
      <dt className="text-charcoal-500">{label}</dt>
      <dd className="font-medium tabular-nums text-charcoal-950">{value}</dd>
    </div>
  );
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
  const [responseId, setResponseId] = useState<FarmerAlternative["id"]>(
    desk.disturbance.recommendedId
  );
  const crop =
    FARMER_CROPS.find((item) => item.id === cropId) ?? FARMER_CROPS[0];
  const onionCurve = crop.id !== "nashik-red-onion";
  const selected = desk.offers.find((offer) => offer.id === selectedId) ?? null;
  const positions = useMemo(() => layout(desk), [desk]);
  const replayLabel = FARMER_REPLAYS.find((item) => item.id === replay)?.label;

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

  function selectCrop(id: string) {
    const next = FARMER_CROPS.find((item) => item.id === id);
    if (!next) return;
    setCropId(next.id);
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

  const response =
    desk.disturbance.alternatives.find((item) => item.id === responseId) ??
    desk.disturbance.alternatives.find(
      (item) => item.id === desk.disturbance.recommendedId
    ) ??
    null;
  const checkpointPoint = desk.coldRoute[checkpoint];
  const activeMarkers =
    disturbance && response ? response.checkpoints : desk.coldRoute;
  const activePoint =
    activeMarkers[Math.min(checkpoint, Math.max(activeMarkers.length - 1, 0))];

  function chooseResponse(id: FarmerAlternative["id"]) {
    const next = desk.disturbance.alternatives.find((item) => item.id === id);
    const currentLabel = (
      disturbance && response ? response.checkpoints : desk.coldRoute
    )[checkpoint]?.label;
    setResponseId(id);
    if (!next) return;
    const same = next.checkpoints.findIndex(
      (point) => point.label === currentLabel
    );
    setCheckpoint(same >= 0 ? same : next.breakdownMarkerIndex);
  }

  function injectBreakdown() {
    setDisturbance(true);
    setCheckpoint(response?.breakdownMarkerIndex ?? desk.breakdownMarkerIndex);
  }

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

      <StepRail step={step} />

      {step === "crop" ? (
        <Card header={<h2 className="font-semibold">Harvest</h2>}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {FARMER_CROPS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`min-w-0 rounded-lg border px-4 py-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta-700 ${
                  cropId === item.id
                    ? "border-terracotta bg-terracotta-50 shadow-xs ring-1 ring-terracotta"
                    : "border-sand-300 bg-white hover:border-sand-400"
                }`}
                aria-pressed={cropId === item.id}
                onClick={() => selectCrop(item.id)}
              >
                <span className="block text-base font-semibold text-charcoal-950">
                  {item.name}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-charcoal-600">
                  {item.note}
                </span>
              </button>
            ))}
          </div>
          <Button
            type="button"
            className="mt-4"
            onClick={() => setStep("place")}
          >
            Continue with {crop.name}
          </Button>
        </Card>
      ) : null}

      {step === "place" ? (
        <Card header={<h2 className="font-semibold">Location and weather</h2>}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="Farm gate"
              value={desk.originName}
              detail={`${desk.latitudeDeg}, ${desk.longitudeDeg}`}
            />
            <Stat
              label="Demonstration weather"
              value={`${desk.weather.temperatureC}°C · ${desk.weather.relativeHumidityPct}% RH`}
              detail={desk.weather.label}
            />
            <Stat label="Crop" value={crop.name} />
          </div>
          {crop.supported ? null : (
            <p className="mt-3 text-sm text-charcoal-700">
              {crop.name} can continue through the map. No rupee quote is
              calculated for it.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={readBrowserPlace}
            >
              Read browser location
            </Button>
            <Button type="button" onClick={() => setStep("map")}>
              Show mandis and buyers
            </Button>
          </div>
          {browserPlace ? (
            <p className="mt-2 text-sm">Browser reported {browserPlace}.</p>
          ) : null}
          {placeNote ? <p className="mt-2 text-sm">{placeNote}</p> : null}
        </Card>
      ) : null}

      {step === "map" || step === "quote" ? (
        <Card header={<h2 className="font-semibold">Mandis and buyers</h2>}>
          <DeskMap
            desk={desk}
            positions={positions}
            priced={crop.supported}
            onionCurve={onionCurve}
            selectedId={selectedId}
            onChoose={choose}
          />
          <p className="mt-3 text-sm text-charcoal-600">
            {crop.supported
              ? `${
                  onionCurve
                    ? `Prices for ${crop.name} are the registered Nashik Red Onion curve, not a separate ${crop.name.toLowerCase()} price. `
                    : ""
                }Recommended mandi by modeled net proceeds: ${
                  desk.offers.find(
                    (offer) => offer.id === desk.recommendedMandiId
                  )?.name
                }. Prices are the baseline register, not a live mandi board.`
              : `${crop.name} has no registered price. The places below are the baseline mandis. No price per kilogram is shown.`}
          </p>
        </Card>
      ) : null}

      {step === "quote" && selected ? (
        <Quote
          offer={selected}
          cropName={crop.name}
          priced={crop.supported}
          onionCurve={onionCurve}
          recommended={
            crop.supported && selected.id === desk.recommendedMandiId
          }
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
          responseId={responseId}
          onSelectResponse={chooseResponse}
          onAdvance={() => {
            const length =
              disturbance && response
                ? response.checkpoints.length
                : desk.coldRoute.length;
            setCheckpoint((current) => Math.min(current + 1, length - 1));
          }}
          onDisturb={injectBreakdown}
          onFinish={() => setStep("done")}
        />
      ) : null}

      {step === "done" && selected && disturbance && response ? (
        <>
          <BreakdownPreview
            response={response}
            undisturbedNetInr={desk.disturbance.undisturbedVashiNetInr}
            checkpointLabel={activePoint?.label ?? "Registered dispatch"}
            checkpointHours={activePoint?.hours ?? 0}
            persistenceNote={desk.persistenceNote}
          />
          <WorkflowHandoff />
        </>
      ) : null}

      {step === "done" && selected && !disturbance ? (
        <Card
          header={<h2 className="font-semibold">Modeled preview report</h2>}
        >
          <p className="text-sm font-medium text-charcoal-900">
            This report was generated in the browser. It is not a persisted
            shipment outcome.
          </p>
          <p className="mt-2 text-sm text-charcoal-800">
            {selected.kind === "premium-buyer"
              ? "The cold-van preview reached the last registered checkpoint. This is not a live delivery receipt."
              : "The mandi preview is complete. No cold van was assigned."}
          </p>
          {selected.kind === "premium-buyer" ? (
            <p className="mt-2 text-sm text-charcoal-700">
              Checkpoint simulation time is{" "}
              {formatClock(checkpointPoint?.hours ?? 0)}. The registered
              cold-room price uses modeled arrival{" "}
              {formatClock(desk.coldPricedArrivalHours)} and modeled completion{" "}
              {formatClock(desk.coldPricedCompletionHours)}. Advancing a
              checkpoint does not recalculate the financial estimate.
            </p>
          ) : null}
          <p className="mt-2 text-sm">
            {crop.supported
              ? `${selected.name}: net ${formatInr(selected.netProceedsInr)} after freight ${formatInr(selected.freightInr)}, other costs ${formatInr(selected.otherCostsInr)}, and ${selected.wastageKg} kg not counted as saleable.`
              : `${crop.name} at ${selected.name}: no net proceeds, freight, or wastage were calculated. The baseline does not contain a price curve for this crop.`}
          </p>
          <p className="mt-2 text-sm text-charcoal-600">
            {desk.persistenceNote}
          </p>
          <WorkflowHandoff />
        </Card>
      ) : null}
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
    </div>
  );
}

function DeskMap({
  desk,
  positions,
  priced,
  onionCurve,
  selectedId,
  onChoose,
}: {
  desk: FarmerDeskModel;
  positions: Map<string, { x: number; y: number }>;
  priced: boolean;
  onionCurve: boolean;
  selectedId: string | null;
  onChoose: (offer: FarmerOffer) => void;
}) {
  const origin = positions.get("origin");
  return (
    <div className="space-y-3">
      <div
        className="relative h-64 overflow-hidden rounded-lg border border-sand-300 bg-sage-50/70 sm:h-80"
        aria-hidden="true"
      >
        <svg className="h-full w-full" viewBox="0 0 100 100">
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
        {origin ? <Pin x={origin.x} y={origin.y} /> : null}
        {desk.offers.map((offer) => {
          const point = positions.get(offer.id);
          if (!point) return null;
          return (
            <span
              key={offer.id}
              className={`absolute w-max max-w-[9rem] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded px-2 py-1 text-xs shadow-xs ${
                selectedId === offer.id
                  ? "bg-terracotta-700 text-white"
                  : "bg-charcoal text-linen"
              }`}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
            >
              {pinLabel(offer.name)}
            </span>
          );
        })}
      </div>
      <ul aria-label="Registered places" className="space-y-2">
        {desk.offers.map((offer) => (
          <li key={offer.id}>
            <button
              type="button"
              className={`w-full rounded-md border px-3 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta-700 ${
                selectedId === offer.id
                  ? "border-terracotta-700 bg-terracotta-50"
                  : "border-sand-300 bg-white"
              }`}
              aria-pressed={selectedId === offer.id}
              onClick={() => onChoose(offer)}
            >
              <span className="block font-semibold text-charcoal-950">
                {offer.name}
              </span>
              <span className="mt-1 block text-sm text-charcoal-700">
                {priced
                  ? `${formatPrice(offer.priceInrPerKg)}/kg${
                      onionCurve
                        ? " · registered Nashik Red Onion curve"
                        : " · registered price"
                    }`
                  : "No crop price"}
                {` · ${offer.distanceKm} km`}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-sm text-charcoal-700">
        The terracotta dot is the registered farm gate. Short names on the map
        match the list, which is the control for choosing a place.
      </p>
    </div>
  );
}

function pinLabel(name: string) {
  if (name.toLowerCase().includes("premium")) return "Premium buyer";
  return name.replace(" APMC", "");
}

function Pin({ x, y }: { x: number; y: number }) {
  return (
    <span
      className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-terracotta-700"
      style={{ left: `${x}%`, top: `${y}%` }}
    />
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
      22 + ((point.longitudeDeg - minLng) / (maxLng - minLng || 1)) * 56;
    const y = 28 + ((maxLat - point.latitudeDeg) / (maxLat - minLat || 1)) * 44;
    map.set(point.id, { x, y });
  }
  return map;
}

function Quote({
  offer,
  cropName,
  priced,
  onionCurve,
  recommended,
  onNearby,
  onPremium,
  onBack,
}: {
  offer: FarmerOffer;
  cropName: string;
  priced: boolean;
  onionCurve: boolean;
  recommended: boolean;
  onNearby: () => void;
  onPremium: () => void;
  onBack: () => void;
}) {
  const margin =
    offer.netProceedsInr >= 0 ? "estimated net proceeds" : "estimated loss";
  return (
    <Card header={<h2 className="font-semibold">{offer.name}</h2>}>
      {priced ? (
        <>
          <p className="text-sm text-charcoal-700">
            {onionCurve
              ? `These amounts are the registered Nashik Red Onion curve, not a separate ${cropName.toLowerCase()} price. `
              : ""}
            {offer.basis}{" "}
            {recommended ? "This is the highest modeled mandi net." : ""} This
            quote is a preview. Finishing it does not reserve a truck.
          </p>
          <dl className="mt-4 divide-y divide-sand-200 text-sm">
            <QuoteRow
              label="Price"
              value={`${formatPrice(offer.priceInrPerKg)}/kg`}
            />
            <QuoteRow
              label="Distance"
              value={`${offer.distanceKm} km · registered road time ${offer.durationHours} h`}
            />
            <QuoteRow label="Saleable" value={`${offer.saleableKg} kg`} />
            <QuoteRow
              label="Wastage not sold"
              value={`${offer.wastageKg} kg`}
            />
            <QuoteRow label="Freight" value={formatInr(offer.freightInr)} />
            <QuoteRow
              label="Other costs"
              value={formatInr(offer.otherCostsInr)}
            />
            <QuoteRow
              label="Total cost"
              value={formatInr(offer.totalCostInr)}
            />
          </dl>
          <div className="mt-4 rounded-lg border border-sage-300 bg-sage-50 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-sage-800">
              {margin}
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-charcoal-950">
              {formatInr(offer.netProceedsInr)}
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-charcoal-700">
          {cropName} can be taken to {offer.name}. Distance {offer.distanceKm}{" "}
          km, registered road time {offer.durationHours} h. No price, wastage,
          freight, or net proceeds are shown, because this crop has no
          registered curve. This preview does not reserve a truck.
        </p>
      )}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {priced && offer.kind === "premium-buyer" ? (
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={onPremium}
          >
            Send to this buyer
          </Button>
        ) : (
          <Button type="button" className="w-full sm:w-auto" onClick={onNearby}>
            {priced ? "Finish mandi preview" : "Finish preview"}
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={onBack}
        >
          Choose another place
        </Button>
      </div>
    </Card>
  );
}

function formatClock(hours: number) {
  return `${hours.toFixed(2)} h`;
}

function formatKg3(quantityKg: number) {
  return `${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 3,
  }).format(quantityKg)} kg`;
}

function WorkflowHandoff() {
  return (
    <div className="mt-4 border-t border-sand-300 pt-4">
      <h3 className="text-sm font-semibold text-charcoal-950">
        Recorded workflow, separate from this preview
      </h3>
      <p className="mt-2 text-sm text-charcoal-700">
        Harvest intake, reservations, and shipments are a different path.
        Opening them does not copy this net, freight, or wastage onto a stored
        shipment. Those screens use the planning catalog, which is a different
        tariff from this baseline quote.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          href="/harvests/new"
          variant="secondary"
          className="w-full sm:w-auto"
        >
          Open harvest intake
        </Button>
        <Button href="/" variant="secondary" className="w-full sm:w-auto">
          Open the operations desk
        </Button>
      </div>
    </div>
  );
}

export function BreakdownPreview({
  response,
  undisturbedNetInr,
  checkpointLabel,
  checkpointHours,
  persistenceNote,
}: {
  response: FarmerAlternative;
  undisturbedNetInr: number;
  checkpointLabel: string;
  checkpointHours: number;
  persistenceNote: string;
}) {
  const interventionNote =
    response.interventionCostInr === response.interventionLineInr
      ? `The intervention charge in the lines above is ${formatInr(response.interventionLineInr)}.`
      : `The intervention line is ${formatInr(response.interventionLineInr)}. The reference intervention total is ${formatInr(response.interventionCostInr)} and is already included in the lines above.`;
  return (
    <Card header={<h2 className="font-semibold">Modeled preview report</h2>}>
      <p className="text-sm font-medium text-charcoal-900">
        This browser preview is for {response.title}. It is not a persisted
        shipment outcome.
      </p>
      <p className="mt-2 text-sm text-charcoal-800">{response.assumption}</p>
      <p className="mt-2 text-sm text-charcoal-700">
        Checkpoint simulation time is {formatClock(checkpointHours)} at{" "}
        {checkpointLabel}. The priced timeline for this response is modeled
        arrival {formatClock(response.arrivalHours)} and modeled completion{" "}
        {formatClock(response.completionHours)}. Advancing a checkpoint does not
        recalculate the financial estimate.
      </p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <ReportFact label="Net" value={formatInr(response.netProceedsInr)} />
        <ReportFact
          label="Delta versus no action"
          value={formatInr(response.deltaInr)}
        />
        <ReportFact label="Saleable" value={formatKg3(response.saleableKg)} />
        <ReportFact label="Grade" value={response.grade} />
        <ReportFact label="Freight" value={formatInr(response.freightInr)} />
        <ReportFact
          label="Other costs"
          value={formatInr(response.otherCostsInr)}
        />
        <ReportFact
          label="Wastage not sold"
          value={formatKg3(response.wastageKg)}
        />
        <ReportFact
          label="Modeled effective age"
          value={formatClock(response.effectiveAgeHours)}
        />
      </dl>
      <ul className="mt-4 space-y-1 text-sm">
        {response.lines.map((line) => (
          <li key={line.component}>
            {line.component}: {formatInr(line.amountInr)} · {line.meaning}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-charcoal-700">{interventionNote}</p>
      <p className="mt-3 text-sm text-charcoal-700">{response.note}</p>
      <p className="mt-3 text-sm text-charcoal-700">
        The undisturbed Vashi sale is {formatInr(undisturbedNetInr)}. It is a
        separate scenario. A higher net among these three breakdown responses
        does not mean this result is higher than that sale.
      </p>
      <p className="mt-2 text-sm text-charcoal-600">{persistenceNote}</p>
    </Card>
  );
}

function ReportFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-charcoal-500">
        {label}
      </dt>
      <dd className="mt-1 font-semibold tabular-nums text-charcoal-950">
        {value}
      </dd>
    </div>
  );
}

function Tracking({
  desk,
  checkpoint,
  disturbance,
  responseId,
  onSelectResponse,
  onAdvance,
  onDisturb,
  onFinish,
}: {
  desk: FarmerDeskModel;
  checkpoint: number;
  disturbance: boolean;
  responseId: FarmerAlternative["id"];
  onSelectResponse: (id: FarmerAlternative["id"]) => void;
  onAdvance: () => void;
  onDisturb: () => void;
  onFinish: () => void;
}) {
  const selected = desk.disturbance.alternatives.find(
    (item) => item.id === responseId
  );
  const markers =
    disturbance && selected ? selected.checkpoints : desk.coldRoute;
  const shownIndex = Math.min(checkpoint, Math.max(markers.length - 1, 0));
  const current = markers[shownIndex];
  const finished = shownIndex >= markers.length - 1;
  const injectEnabled = canInjectBreakdown(
    checkpoint,
    desk.breakdownMarkerIndex,
    disturbance
  );
  return (
    <Card
      header={
        <h2 className="font-semibold">
          {disturbance && selected
            ? `Registered markers · ${selected.title}`
            : "Cold-van checkpoints"}
        </h2>
      }
    >
      <p className="text-sm text-charcoal-700">
        These markers follow the registered edges, pauses, and holds for this
        route. They are not a live GPS track. Fictional places keep the
        fictional label from the register. A pause is a registered wait, not a
        new road.
      </p>
      <ol className="mt-3 space-y-2" aria-label="Registered route markers">
        {markers.map((point, index) => (
          <li
            key={`${point.label}-${point.hours}`}
            className={`rounded-md border px-3 py-2 text-sm ${
              index <= shownIndex
                ? "border-sage-600 bg-sage-50"
                : "border-sand-300"
            }`}
          >
            {point.label} · {formatClock(point.hours)}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm" role="status">
        Checkpoint simulation time is {formatClock(current?.hours ?? 0)} at{" "}
        {current?.label}. Advancing a checkpoint does not recalculate the
        financial estimate.
      </p>
      <p className="mt-2 text-sm text-charcoal-700">
        {disturbance && selected
          ? `Priced timeline for ${selected.title}: modeled arrival ${formatClock(selected.arrivalHours)} and modeled completion ${formatClock(selected.completionHours)}. Marker hours are only the registered step durations.`
          : `The cold-van quote uses the registered cold-room timeline: modeled arrival ${formatClock(desk.coldPricedArrivalHours)} and modeled completion ${formatClock(desk.coldPricedCompletionHours)}. Marker hours are only the registered step durations.`}
      </p>
      <p className="mt-2 text-sm text-charcoal-700">{BREAKDOWN_INJECT_NOTE}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          className="min-h-11 rounded-md bg-terracotta-700 px-3.5 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta-700 disabled:opacity-50"
          type="button"
          disabled={finished}
          onClick={onAdvance}
        >
          Advance checkpoint
        </button>
        <button
          className="min-h-11 rounded-md border border-sand-400 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta-700 disabled:opacity-50"
          type="button"
          disabled={!injectEnabled}
          onClick={onDisturb}
        >
          Inject a breakdown
        </button>
        <button
          className="min-h-11 rounded-md border border-sand-400 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta-700 disabled:opacity-50"
          type="button"
          disabled={!finished && !disturbance}
          onClick={onFinish}
        >
          Generate report
        </button>
      </div>
      {disturbance ? (
        <fieldset
          className="mt-4 space-y-3"
          data-selected-response={responseId}
        >
          <legend className="text-sm font-semibold text-charcoal-950">
            Choose a modeled response
          </legend>
          <p className="text-sm text-charcoal-700">
            {desk.disturbance.detail} {desk.disturbance.recommendationNote}{" "}
            Undisturbed Vashi sale:{" "}
            {formatInr(desk.disturbance.undisturbedVashiNetInr)}.
          </p>
          {desk.disturbance.alternatives.map((item) => {
            const highest = item.id === desk.disturbance.recommendedId;
            const checked = item.id === responseId;
            return (
              <label
                key={item.id}
                className={`block cursor-pointer rounded-md border px-3 py-3 ${
                  checked
                    ? "border-terracotta-700 bg-terracotta-50"
                    : "border-sand-300 bg-white"
                }`}
              >
                <span className="flex items-start gap-3">
                  <input
                    className="mt-1 h-4 w-4 accent-terracotta-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta-700"
                    type="radio"
                    name="breakdown-response"
                    value={item.id}
                    checked={checked}
                    onChange={() => onSelectResponse(item.id)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-charcoal-950">
                        {item.title}
                      </span>
                      {highest ? (
                        <Badge tone="sage">Highest of these three</Badge>
                      ) : null}
                    </span>
                    <span className="mt-2 grid gap-1 text-sm text-charcoal-800 sm:grid-cols-2">
                      <span>Net {formatInr(item.netProceedsInr)}</span>
                      <span>
                        Delta versus no action {formatInr(item.deltaInr)}
                      </span>
                      <span>Saleable {formatKg3(item.saleableKg)}</span>
                      <span>Grade {item.grade}</span>
                      <span>Freight {formatInr(item.freightInr)}</span>
                    </span>
                    <span className="mt-2 block text-sm text-charcoal-600">
                      {item.note}
                    </span>
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>
      ) : null}
    </Card>
  );
}
