type SvgElement = {
    tag: string;
    id?: string;
    attrs?: Record<string, string>;
};

type SvgGroup = {
    id?: string;
    dataName?: string;
    elements?: SvgElement[];
    groups?: SvgGroup[];
};

declare const svgGroups: SvgGroup[];

export default svgGroups;
export { svgGroups };

