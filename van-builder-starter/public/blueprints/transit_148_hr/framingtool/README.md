# VanIQ 3D Builder

Parametric 3D visualizer for a Ford Transit 350 148" wheelbase, high-roof camper conversion using 1515 and 1010 t-slot aluminum extrusion.

## Live demo

Once GitHub Pages is enabled on this repo: `https://bizdisruptor.github.io/vaniq-3d-builder/`

## Use on iPad

1. Open the live URL in Safari
2. Tap the Share button → "Add to Home Screen" for a full-screen app icon
3. One finger to orbit, pinch to zoom, tap a stick to inspect

## Locked design spec

### Van shell
- Interior: 120" L × 78" W × 81" H (Transit 148" WB, high-roof)
- Counter plane: 37" (bed top, galley top, workspace top all at this height)
- Wheel wells: xStart=18", length=30", depth=9", height=17" (one each side)

### Coordinate convention
- Viewer at REAR looking forward (canonical reference frame)
- Origin: floor center at rear door threshold
- +X = forward (toward cab), Rear = X=0, Front = X=120
- +Y = DRIVER (right when viewing from rear)
- -Y = PASSENGER (left when viewing from rear)
- +Z = up
- Top-down view: front at top of screen, rear at bottom, driver right, passenger left
- Units: inches throughout

### Sections

| Section    | Position           | Dimensions (L × D × H) | Doors/Bays | Profile |
|------------|--------------------|------------------------|------------|---------|
| Electrical | Rear, driver       | 65 × 15.5 × 37         | 3 doors    | 1515    |
| Plumbing   | Rear, passenger    | 65 × 15.5 × 37         | 3 doors    | 1515    |
| Bed rails  | Across garage      | 4 cross sticks @ z=37  | —          | 1515    |
| Galley     | Passenger, fwd     | 38 × 20 × 37           | 2 doors    | 1515    |
| Workspace  | Driver, fwd        | 55 × 20 × 37           | 3 bays     | 1515    |
| Upper      | Driver, ceiling    | 108 × 10 × 10          | 6 doors    | 1010    |

### Workspace bay layout (driver side, forward of electrical)
- Closet (rear, 16"): 1 door
- Drawers (middle, 17"): 4 drawer runner rails on front face
- Fridge (front, 22"): no internal sticks, open for fridge to slide in

### Bed rails
- 4 cross sticks at counter level (z=37)
- First at x=0, last at x=65 (zone boundaries with plumbing/electrical)
- Middle two evenly spaced (x=21.67, x=43.33)

### Stick generation rules

**Door cabinets:**
- Front face: corner verticals + door-divider verticals (N+1 total for N doors) + top long rail + bottom long rail
- **NO mid-height horizontal rails on the front face** (doors swing here)
- Back face: matching verticals + top long rail + bottom long rail + mid-height back long rail
- Top frame: front + back long rails + Y-cross rails at every vertical position
- Bottom frame: front + back long rails. For floor-mounted cabinets, Y-cross rails ONLY at corners (floor + wall anchors carry rigidity)
- Mid-height: back long rail + Y-cross rails at interior dividers only (not corners)
- Wheel-well-aware cabinets (plumbing, electrical): bottom-back rail SEGMENTED around wheel well, plus above-WW back rail at z=18"

**Workspace bays:**
- Drawer bay: N horizontal drawer-runner rails on front + back face
- Door bay: door divider verticals at bay edges, mid back rail across the bay, no front mid rails
- Fridge bay: no internal sticks (open for fridge)

**Bed rails:** Y-axis sticks at z=37-EX (top of rail at exactly 37"), spanning between plumbing inner face and electrical inner face

**Stick merging:** Sticks at the same profile/axis/position/length within 0.1" tolerance merge into one stick with combined section tags. Handles shared sticks at section interfaces (e.g. the corner leg shared between galley and plumbing).

**Mounting (metadata only, not rendered):**
- Back-facing sticks attach to van walls via rivnuts
- Bottom corners attach to van floor via L-brackets or rivnuts

### Shipping length limit
1515 and 1010 typically ship at ≤96" per stick. Cut list flags any sticks exceeding this.

## File layout

- `index.html` — single-file builder, all code, vendored Three.js from CDN
- `README.md` — this file
- `.nojekyll` — tells GitHub Pages to serve the HTML directly without Jekyll processing

## Version history

- **v13** — fix slider/editor bug (separated renderScene from renderEditor), improved iPad touch handling
- **v12** — removed interior bottom Y-sticks for floor-mounted cabinets, reordered workspace bays
- **v11** — bay-structured workspace, per-blueprint stick rules
- **v10** — opened cabinet fronts (no front mid-rails)
- **v9** — wheel well segmentation, upper rack truss
- **v1–v8** — coordinate convention, stick model, section anchoring iterations
