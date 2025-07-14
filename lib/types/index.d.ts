export declare const config: {
    /** value in the rage (1, ∞) determining the zoom speed of the scrollwheel */
    scroll_sensitivity: number;
    /** value in the range (0, ∞) determining the sensitivity of the rotation */
    rotation_sensitivity: number;
    panning: boolean;
    zooming: boolean;
    rotating: boolean;
};
export declare class RenderSpace {
    private _canvas;
    private _ctx;
    private _zoom;
    private _offset;
    private offset_proxy;
    private _rotation;
    constructor(canvas: HTMLCanvasElement, ctx?: CanvasRenderingContext2D);
    updateTransform(): void;
    translate(translation: {
        x: number;
        y: number;
    }): void;
    zoomInto(center: {
        x: number;
        y: number;
    }, zoom: number): void;
    rotateAround(center: {
        x: number;
        y: number;
    }, angle: number): void;
    get canvas(): HTMLCanvasElement;
    get ctx(): CanvasRenderingContext2D;
    get zoom(): number;
    set zoom(value: number);
    get offset(): {
        x: number;
        y: number;
    };
    set offset(value: {
        x: number;
        y: number;
    });
    get rotation(): number;
    set rotation(value: number);
}
//# sourceMappingURL=index.d.ts.map