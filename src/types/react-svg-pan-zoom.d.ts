declare module 'react-svg-pan-zoom' {
    import * as React from 'react';

    type ReactSVGPanZoomProps = Record<string, unknown>;

    export const ReactSVGPanZoom: React.ComponentType<ReactSVGPanZoomProps>;
    export const TOOL_PAN: string;
    export const TOOL_AUTO: string;
    export const POSITION_NONE: string;
    export const INITIAL_VALUE: unknown;
}
