type MapConnection = {
    from: string;
    to: string;
    type?: string;
};

declare const connections: MapConnection[];

export default connections;
export { connections };

