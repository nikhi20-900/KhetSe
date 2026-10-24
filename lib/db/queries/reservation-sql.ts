/**
 * Capacity changes run inside one PostgreSQL function call.
 * A single statement takes the row lock, checks the remaining kilograms or
 * slots, and writes the reservation. Concurrent calls cannot both pass.
 */

export const RESERVATION_SQL = `
CREATE OR REPLACE FUNCTION reserve_hold(
  p_plan_key text,
  p_allocated_kg double precision,
  p_lock_minutes integer,
  p_transport_id text,
  p_storage_id text,
  p_vehicle_prefix text,
  p_reservation_id text,
  p_idempotency_key text,
  p_request_hash text
) RETURNS jsonb
LANGUAGE plpgsql
AS $fn$
DECLARE
  existing_hash text;
  existing_json jsonb;
  slot_id text;
  slot_available double precision;
  slot_type text;
  facility_id text;
  facility_name text;
  free_slots integer;
  per_slot double precision;
  needed_slots integer;
  new_id text;
  response jsonb;
  expired record;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext(p_idempotency_key));
    SELECT "requestHash", "responseJson" INTO existing_hash, existing_json
    FROM idempotency_records WHERE key = p_idempotency_key;
    IF FOUND THEN
      IF existing_hash <> p_request_hash THEN
        RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT: This idempotency key was already used for a different reservation request.';
      END IF;
      RETURN existing_json;
    END IF;
  END IF;

  FOR expired IN
    SELECT id, "allocatedKg", "allocatedSlots", "transportSlotId", "storageFacilityId"
    FROM reservations
    WHERE status IN ('PENDING', 'CONFIRMED') AND "expiresAt" <= NOW()
    ORDER BY id
    FOR UPDATE
  LOOP
    IF expired."transportSlotId" IS NOT NULL THEN
      UPDATE transport_slots
      SET "availableKg" = LEAST("capacityKg", "availableKg" + expired."allocatedKg")
      WHERE id = expired."transportSlotId";
    END IF;
    IF expired."storageFacilityId" IS NOT NULL AND expired."allocatedSlots" IS NOT NULL THEN
      UPDATE storage_facilities
      SET "freeSlots" = LEAST("totalSlots", "freeSlots" + expired."allocatedSlots")
      WHERE id = expired."storageFacilityId";
    END IF;
    UPDATE reservations SET status = 'EXPIRED', "updatedAt" = NOW() WHERE id = expired.id;
  END LOOP;

  IF p_transport_id IS NOT NULL THEN
    SELECT id, "availableKg", "vehicleType" INTO slot_id, slot_available, slot_type
    FROM transport_slots WHERE id = p_transport_id FOR UPDATE;
    IF slot_id IS NULL THEN
      RAISE EXCEPTION 'TRANSPORT_SLOT_NOT_FOUND: Transport slot % does not exist.', p_transport_id;
    END IF;
  ELSIF p_storage_id IS NULL THEN
    SELECT id, "availableKg", "vehicleType" INTO slot_id, slot_available, slot_type
    FROM transport_slots
    WHERE "availableKg" >= p_allocated_kg
      AND (
        p_vehicle_prefix IS NULL
        OR id = p_vehicle_prefix
        OR id LIKE p_vehicle_prefix || '-%'
      )
    ORDER BY id
    FOR UPDATE
    LIMIT 1;
    IF slot_id IS NULL THEN
      RAISE EXCEPTION 'CAPACITY_EXCEEDED: Requested % kg exceeds remaining transport capacity.', p_allocated_kg;
    END IF;
  END IF;

  IF slot_id IS NOT NULL THEN
    IF slot_available < p_allocated_kg THEN
      RAISE EXCEPTION 'CAPACITY_EXCEEDED: Requested % kg exceeds remaining capacity (% kg) on %.', p_allocated_kg, slot_available, slot_type;
    END IF;
    UPDATE transport_slots
    SET "availableKg" = "availableKg" - p_allocated_kg
    WHERE id = slot_id AND "availableKg" >= p_allocated_kg;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'CAPACITY_EXCEEDED: Transport slot % was claimed by a concurrent booking.', slot_id;
    END IF;
  END IF;

  IF p_storage_id IS NOT NULL THEN
    SELECT id, "freeSlots", "kgPerSlot", name INTO facility_id, free_slots, per_slot, facility_name
    FROM storage_facilities WHERE id = p_storage_id FOR UPDATE;
    IF facility_id IS NULL THEN
      RAISE EXCEPTION 'STORAGE_FACILITY_NOT_FOUND: Storage facility % does not exist.', p_storage_id;
    END IF;
    needed_slots := ceil(p_allocated_kg / per_slot);
    IF needed_slots > free_slots THEN
      RAISE EXCEPTION 'CAPACITY_EXCEEDED: Requested % kg needs % slots, but % has % free slots.', p_allocated_kg, needed_slots, facility_name, free_slots;
    END IF;
    UPDATE storage_facilities
    SET "freeSlots" = "freeSlots" - needed_slots
    WHERE id = facility_id AND "freeSlots" >= needed_slots;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'CAPACITY_EXCEEDED: Storage facility % was claimed by a concurrent booking.', facility_id;
    END IF;
  END IF;

  INSERT INTO reservations (
    id, status, "requestedPlanKey", "transportSlotId", "storageFacilityId",
    "allocatedKg", "allocatedSlots", "expiresAt", "createdAt", "updatedAt"
  ) VALUES (
    p_reservation_id,
    'CONFIRMED',
    p_plan_key,
    slot_id,
    facility_id,
    p_allocated_kg,
    needed_slots,
    NOW() + make_interval(mins => p_lock_minutes),
    NOW(),
    NOW()
  ) RETURNING id INTO new_id;

  SELECT jsonb_build_object(
    'reservationId', id,
    'status', status,
    'allocatedKg', "allocatedKg",
    'allocatedSlots', "allocatedSlots",
    'expiresAt', to_char("expiresAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'transportSlotId', "transportSlotId",
    'storageFacilityId', "storageFacilityId",
    'requestedPlanKey', "requestedPlanKey",
    'message', 'Capacity hold confirmed until ' || to_char("expiresAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') || '. This is simulated demonstration capacity, not a carrier booking.'
  ) INTO response
  FROM reservations WHERE id = new_id;

  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO idempotency_records (key, operation, "requestHash", "responseStatus", "responseJson", "createdAt")
    VALUES (p_idempotency_key, 'book', p_request_hash, 201, response, NOW());
  END IF;

  RETURN response;
END;
$fn$;
`;
