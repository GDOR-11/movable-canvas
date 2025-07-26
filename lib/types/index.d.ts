import { vec2, mat2d } from "gl-matrix";
export declare class Transform {
    translation: vec2;
    zoom: number;
    rotation: number;
    constructor(translation?: vec2, zoom?: number, rotation?: number);
    translationMatrix(): mat2d;
    scalingMatrix(): mat2d;
    rotationMatrix(): mat2d;
    matrix(): mat2d;
    translate(translation: vec2): void;
    zoomInto(center: vec2, zoom: number): void;
    rotateAround(center: vec2, angle: number): void;
    lerp(transform: Transform, t: number): void;
    copy(transform: Transform): void;
    /** mutates the argument!!! */
    apply(point: vec2): vec2;
    inverse(): Transform;
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
    /** mutates the argument!!! */
    renderSpaceToScreen(point: vec2): vec2;
    /** mutates the argument!!! */
    screenToRenderSpace(point: vec2): vec2;
    translate(translation: vec2): void;
    zoomInto(center: vec2, zoom: number): void;
    rotateAround(center: vec2, angle: number): void;
    lerp(transform: Transform, t: number): void;
    addListener(listener: (space: RenderSpace) => any): void;
    removeListener(listener: (space: RenderSpace) => any): void;
    clearScreen(): void;
    get canvas(): HTMLCanvasElement;
    get listeners(): ((space: RenderSpace) => any)[];
}
//# sourceMappingURL=index.d.ts.map