export type ViewId =
  | 'plan'
  | 'roof'
  | 'driver_elev'
  | 'passenger_elev'
  | 'rear_elev'
  | 'front_elev';

export interface VanDimensions {
  partition_depth: number;
  inside_roof_height: number;
  driver_wall_usable_length: number;
  passenger_wall_usable_length: number;
  side_door_opening_width: number;
  rear_door_opening_width: number;
  wheel_well_width: number;
  wheel_well_height: number;
  wheel_well_depth: number;
  distance_between_wheel_wells: number;
}

export interface AxisMarker {
  name: string;
  y: number;
}

export interface WheelWellAnchor {
  side: 'driver' | 'passenger';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LegendItem {
  key: string;
  label: string;
}

export interface PlanViewDefinition {
  asset: string;
  orientation: 'portrait' | 'landscape';
  canvas: { width: number; height: number };
  interior_box: { x: number; y: number; width: number; height: number };
  centerline_x: number;
  bulkhead_line_y: number;
  rear_door_line_y: number;
  wheel_wells: WheelWellAnchor[];
  pillars: AxisMarker[];
  ribs: AxisMarker[];
  slide_door: { side: 'driver' | 'passenger'; y_start: number; y_end: number };
  legend: LegendItem[];
}

export interface RoofViewDefinition {
  asset: string;
  orientation: 'portrait' | 'landscape';
  canvas: { width: number; height: number };
  centerline_x: number;
  crossmembers: AxisMarker[];
  safe_mount_corridors: Array<{ x: number; y: number; width: number; height: number }>;
  legend: LegendItem[];
}

export interface ElevationViewDefinition {
  asset: string;
  usable_length?: number;
}

export interface VanDefinition {
  id: string;
  label: string;
  manufacturer: string;
  years: number[];
  source: { name: string; notes?: string };
  dimensions: VanDimensions;
  views: {
    plan: PlanViewDefinition;
    roof: RoofViewDefinition;
    driver_elev: ElevationViewDefinition;
    passenger_elev: ElevationViewDefinition;
    rear_elev: ElevationViewDefinition;
    front_elev: ElevationViewDefinition;
  };
}
