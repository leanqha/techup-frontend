import techUpMap from '../../assets/TechUpMap.svg';

export type FloorPlanPoint = {
    id: string;
    label: string;
    x: number;
    y: number;
};

export type FloorPlanRoute = {
    id: string;
    from: string;
    to: string;
    color?: string;
};

export type FloorPlanTestData = {
    svgUrl: string;
    viewBox: string;
    points: FloorPlanPoint[];
    routes: FloorPlanRoute[];
};

export const floor2PlanTest: FloorPlanTestData = {
    // Uses the SVG stored in src/assets/TechUpMap.svg.
    svgUrl: techUpMap,
    viewBox: '0 0 154.05 174.49',
    // Points copied from the SVG edges group (cx/cy coordinates).
    points: [
        { id: '2', label: '2', x: 48.61, y: 109.26 },
        { id: '1201-a', label: '1201-a', x: 41.87, y: 97.58 },
        { id: '1206-a', label: '1206-a', x: 40.2, y: 94.69 },
        { id: '1206-b', label: '1206-b', x: 34.98, y: 85.65 },
        { id: '1201-b', label: '1201-b', x: 31.75, y: 80.07 },
        { id: '1205', label: '1205', x: 26.8, y: 71.49 },
        { id: '1204', label: '1204', x: 20.75, y: 61 },
        { id: '9', label: '9', x: 19.7, y: 59.18 },
        { id: '10', label: '10', x: 36.86, y: 49.28 },
        { id: '1203-a', label: '1203-a', x: 41.24, y: 41.68 },
        { id: '1203-b', label: '1203-b', x: 55.26, y: 17.4 },
        { id: '1200-stairs', label: 'stairs', x: 59.28, y: 103.11 },
        { id: '1215-a', label: '1215-a', x: 61.4, y: 131.41 },
        { id: '1209-a', label: '1209-a', x: 64.3, y: 136.43 },
        { id: '1209-b', label: '1209-b', x: 67.68, y: 142.3 },
        { id: '1210-a', label: '1210-a', x: 73, y: 151.51 },
        { id: '1215-b', label: '1215-b', x: 67.08, y: 141.25 },
        { id: '12', label: '12', x: 73.77, y: 152.84 },
        { id: '1210-b', label: '1210-b', x: 81.41, y: 166.07 },
        { id: 'mens-wc', label: 'wc-m', x: 89.07, y: 152.84 },
        { id: '1211-a', label: '1211-a', x: 101.24, y: 152.84 },
        { id: '1211-b', label: '1211-b', x: 117.4, y: 152.84 },
        { id: '1212', label: '1212', x: 133.3, y: 152.84 },
        { id: '1213', label: '1213', x: 137.42, y: 152.84 },
        { id: '1214', label: '1214', x: 137.42, y: 159.5 },
        { id: '1202', label: '1202', x: 25.17, y: 68.69 },
    ],
    // Fill in the actual routes you want to test.
    routes: [],
};
