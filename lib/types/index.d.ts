export type Vec = {
    x: number;
    y: number;
};
export declare class Transform {
    translation: Vec;
    zoom: number;
    rotation: number;
    constructor(translation?: Vec, zoom?: number, rotation?: number);
    translate(translation: Vec): void;
    zoomInto(center: Vec, zoom: number): void;
    rotateAround(center: Vec, angle: number): void;
    lerp(transform: Transform, t: number): void;
}
export default class RenderSpace {
    ctx: CanvasRenderingContext2D;
    transform: Transform;
    target_transform: Transform;
    _listeners: ((space: RenderSpace) => any)[];
    config: {
        /** value in the rage (1, ∞) determining the zoom speed of the scrollwheel */
        scroll_sensitivity: number;
        /** value in the range (0, ∞) determining the sensitivity of the rotation */
        rotation_sensitivity: number;
        /** value in the range [0, ∞) determining the strength of damping */
        damping_strength: number;
        panning: boolean;
        zooming: boolean;
        rotating: boolean;
    };
    constructor(canvas: HTMLCanvasElement);
    constructor(ctx: CanvasRenderingContext2D);
    updateDamping(dt: number, update_transform?: boolean): void;
    updateTransform(): void;
    translate(translation: Vec): void;
    zoomInto(center: Vec, zoom: number): void;
    rotateAround(center: Vec, angle: number): void;
    lerp(transform: Transform, t: number): void;
    addListener(listener: (space: RenderSpace) => any): void;
    removeListener(listener: (space: RenderSpace) => any): void;
    clearScreen(): void;
    get canvas(): HTMLCanvasElement;
    get listeners(): ((space: RenderSpace) => any)[];
}
//# sourceMappingURL=index.d.ts.map