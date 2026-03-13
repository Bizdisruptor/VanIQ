/**
 * Ford Transit 148 High Roof — Canonical Dimensions
 * Source: Ford 2022 Transit Specs PDF + Ford BEMM (V363N_Transit_Update-MY2024)
 * DO NOT EDIT without updating source document reference.
 */

export const TRANSIT_148_HR = {
  // ── Exterior ──────────────────────────────────────────────────────────────
  overallLength:           235.5,  // in
  overallWidthNoMirrors:    81.3,  // in
  wheelbase:               147.6,  // in
  rearOverhang:             47.6,  // in

  // ── Cargo / Interior ──────────────────────────────────────────────────────
  cargoLengthAtFloor:      143.7,  // in (max)
  cargoLengthAtBelt:       133.6,  // in (max)
  cargoWidthMax:            70.2,  // in (excluding wheelhouses)
  cargoWidthBetweenWells:   54.8,  // in ← THE KEY NUMBER
  cargoHeightMax:           81.5,  // in
  insideRoofHeight:         79.0,  // in (High Roof)
  loadHeightCurb:           28.7,  // in

  // ── Doors ─────────────────────────────────────────────────────────────────
  rearDoorOpeningWidth:     61.7,  // in
  rearDoorOpeningHeight:    74.3,  // in
  slideDoorOpeningWidth:    48.0,  // in

  // ── Wheel Wells ───────────────────────────────────────────────────────────
  wheelWellLength:          35.0,  // in (fore-aft)
  wheelWellHeight:          11.0,  // in (floor to top of well)
  wheelWellDepth:            7.5,  // in (lateral intrusion into cargo)

  // ── Builder Reference ─────────────────────────────────────────────────────
  partitionDepth:            9.0,  // in
  driverWallLength:        126.0,  // in (usable)
  passengerWallLength:      75.0,  // in (usable)

  // ── Slide Door Position (from bulkhead) ───────────────────────────────────
  slideDoorStart:           30.0,  // in from bulkhead
  slideDoorEnd:             78.0,  // in from bulkhead

  // ── Wheel Well Position (from bulkhead) ───────────────────────────────────
  wheelWellStart:           85.0,  // in from bulkhead (fore edge)

  // ── Height Zones ──────────────────────────────────────────────────────────
  roofHeightLR:             53.0,  // in Low Roof
  roofHeightMR:             70.0,  // in Medium Roof
  roofHeightHR:             79.0,  // in High Roof (this build)
} as const;

export type VanModel = typeof TRANSIT_148_HR;
