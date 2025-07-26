import { vec2, mat2d } from "gl-matrix";

// gotta implement it myself until
// github.com/toji/gl-matrix/pull/490 gets accepted
function signedAngle(a: vec2, b: vec2): number {
    let ax = a[0], ay = a[1],
        bx = b[0], by = b[1];
    return Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
}

export class Transform {
    translation: vec2 = vec2.create();
    zoom: number = 1;
    rotation: number = 0;

    constructor(translation?: vec2, zoom?: number, rotation?: number) {
        this.translation = translation || this.translation;
        this.zoom = zoom || this.zoom;
        this.rotation = rotation || this.rotation;
    }

    translationMatrix(): mat2d {
        return mat2d.fromTranslation(mat2d.create(), this.translation);
    }
    scalingMatrix(): mat2d {
        return mat2d.fromScaling(mat2d.create(), [this.zoom, this.zoom]);
    }
    rotationMatrix(): mat2d {
        return mat2d.fromRotation(mat2d.create(), this.rotation);
    }
    matrix(): mat2d {
        let m = mat2d.create();
        mat2d.mul(m, this.translationMatrix(), this.scalingMatrix());
        mat2d.mul(m, m, this.rotationMatrix());
        return m;
    }

    translate(translation: vec2) {
        vec2.add(this.translation, this.translation, translation);
    }
    zoomInto(center: vec2, zoom: number) {
        this.zoom *= zoom;
        vec2.sub(this.translation, this.translation, center);
        vec2.scaleAndAdd(this.translation, center, this.translation, zoom);
    }
    rotateAround(center: vec2, angle: number) {
        this.rotation += angle;
        vec2.rotate(this.translation, this.translation, center, angle);
    }

    lerp(transform: Transform, t: number) {
        vec2.lerp(this.translation, this.translation, transform.translation, t);
        this.zoom = (1 - t) * this.zoom + t * transform.zoom;
        this.rotation = (1 - t) * this.rotation + t * transform.rotation;
    }

    copy(transform: Transform) {
        vec2.copy(this.translation, transform.translation);
        this.zoom = transform.zoom;
        this.rotation = transform.rotation;
    }

    /** mutates the argument!!! */
    apply(point: vec2): vec2 {
        return vec2.transformMat2d(point, point, this.matrix());
    }

    inverse(): Transform {
        let p = vec2.negate(vec2.create(), this.translation);
        vec2.scale(p, p, 1 / this.zoom);
        vec2.rotate(p, p, vec2.create(), -this.rotation);
        return new Transform(p, 1 / this.zoom, -this.rotation);
    }
}

export default class RenderSpace {
    ctx: CanvasRenderingContext2D;
    transform: Transform;
    target_transform: Transform;
    _listeners: ((space: RenderSpace) => any)[] = [];

    config = {
        /** value in the rage (1, ∞) determining the zoom speed of the scrollwheel */
        scroll_sensitivity: 1.01,
        /** value in the range (0, ∞) determining the sensitivity of the rotation */
        rotation_sensitivity: 0.01,
        /** value in the range [0, ∞) determining the strength of damping */
        damping_strength: 0,
        panning: true,
        zooming: true,
        rotating: true
    };

    constructor(canvas: HTMLCanvasElement);
    constructor(ctx: CanvasRenderingContext2D);
    constructor(arg: HTMLCanvasElement | CanvasRenderingContext2D) {
        let ctx = arg instanceof HTMLCanvasElement ? arg.getContext("2d") : arg;
        if (ctx === null) throw new Error("Failed to get CanvasRenderingContext2D");
        this.ctx = ctx;

        this.transform = new Transform();
        this.target_transform = new Transform();

        this.canvas.style.touchAction = "none";
        event_listeners(this, this.canvas);
    }

    updateDamping(dt: number, update_transform: boolean = true) {
        this.transform.lerp(this.target_transform, 1 - Math.exp(-dt / this.config.damping_strength));
        if (update_transform) this.updateTransform();
    }
    updateTransform() {
        if (this.config.damping_strength === 0) {
            this.transform.copy(this.target_transform);
        }
        this.ctx.resetTransform();
        this.ctx.translate(...this.transform.translation as [number, number]);
        this.ctx.rotate(this.transform.rotation);
        this.ctx.scale(this.transform.zoom, this.transform.zoom);
        this._listeners.forEach(listener => listener(this));
    }

    /** mutates the argument!!! */
    renderSpaceToScreen(point: vec2): vec2 {
        return this.transform.apply(point);
    }
    /** mutates the argument!!! */
    screenToRenderSpace(point: vec2): vec2 {
        return this.transform.inverse().apply(point);
    }

    /**
      * returns the smallest render-space AABB that covers the entire screen
      * @returns {[vec2, vec2]} top left and bottom right corner
      **/
    getScreenAABB(): [vec2, vec2] {
        let screen_corners = [
            vec2.fromValues(0, 0),
            vec2.fromValues(0, this.canvas.height),
            vec2.fromValues(this.canvas.width, 0),
            vec2.fromValues(this.canvas.width, this.canvas.height)
        ].map(this.screenToRenderSpace.bind(this));
        let x = screen_corners.map(v => v[0]);
        let y = screen_corners.map(v => v[1]);

        return [
            vec2.fromValues(Math.min(...x), Math.min(...y)),
            vec2.fromValues(Math.max(...x), Math.max(...y))
        ];
    }

    translate(translation: vec2) {
        this.target_transform.translate(translation);
    }
    zoomInto(center: vec2, zoom: number) {
        this.target_transform.zoomInto(center, zoom);
    }
    rotateAround(center: vec2, angle: number) {
        this.target_transform.rotateAround(center, angle);
    }
    lerp(transform: Transform, t: number) {
        this.target_transform.lerp(transform, t);
    }

    addListener(listener: (space: RenderSpace) => any) {
        this._listeners.push(listener);
    }
    removeListener(listener: (space: RenderSpace) => any) {
        this._listeners.splice(this._listeners.indexOf(listener), 1);
    }

    clearScreen() {
        this.ctx.save();
        this.ctx.resetTransform();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    get canvas(): HTMLCanvasElement {
        return this.ctx.canvas;
    }
    get listeners(): ((space: RenderSpace) => any)[] {
        return this._listeners.slice();
    }
}


function event_listeners(space: RenderSpace, canvas: HTMLCanvasElement) {
    type Pointer = {
        pos: vec2,
        button: number
    };
    let pointers: { [id: string]: Pointer } = {};

    canvas.addEventListener("contextmenu", event => event.preventDefault());
    canvas.addEventListener("pointerdown", event => {
        pointers[event.pointerId] = {
            pos: vec2.fromValues(event.offsetX, event.offsetY),
            button: event.button
        };
    });
    canvas.addEventListener("pointerup", event => {
        delete pointers[event.pointerId];
    });

    canvas.addEventListener("pointermove", event => {
        const pointer = pointers[event.pointerId];
        if (!pointer) return;

        let last = vec2.clone(pointer.pos);
        vec2.set(pointer.pos, event.offsetX, event.offsetY);

        switch (Object.keys(pointers).length) {
            case 1:
                if (pointer.button === 2 && space.config.rotating) {
                    space.rotateAround(
                        [canvas.width / 2, canvas.height / 2],
                        space.config.rotation_sensitivity * (pointer.pos[0] - last[0])
                    );
                }
                if (pointer.button == 0 && space.config.panning) {
                    space.translate(vec2.sub(vec2.create(), pointer.pos, last));
                }
                space.updateTransform();
                break;
            case 2:
                const anchor = Object.values(pointers).find(p => p !== pointer);
                if (anchor === undefined) throw new Error("something is really wrong bro, good luck debugging ts");
                let center = vec2.add(vec2.create(), pointer.pos, anchor.pos);
                vec2.scale(center, center, 0.5);

                let diff = vec2.sub(vec2.create(), pointer.pos, anchor.pos);
                let last_diff = vec2.sub(vec2.create(), last, anchor.pos);

                if (space.config.panning) {
                    let movement = vec2.sub(vec2.create(), pointer.pos, last);
                    space.translate(vec2.scale(movement, movement, 0.5));
                }
                if (space.config.zooming) {
                    space.zoomInto(center, vec2.len(diff) / vec2.len(last_diff));
                }
                if (space.config.rotating) {
                    space.rotateAround(center, signedAngle(last_diff, diff));
                }
                space.updateTransform();
                break;
        }
    });

    canvas.addEventListener("wheel", event => {
        if (!space.config.zooming) return;
        let zoom = Math.pow(space.config.scroll_sensitivity, -event.deltaY);
        space.zoomInto([ event.offsetX, event.offsetY ], zoom);
        space.updateTransform();
        event.preventDefault();
    }, { passive: false });
}
