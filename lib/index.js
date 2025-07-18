export class Transform {
    constructor(translation, zoom, rotation) {
        this.translation = { x: 0, y: 0 };
        this.zoom = 1;
        this.rotation = 0;
        this.translation = translation || this.translation;
        this.zoom = zoom || this.zoom;
        this.rotation = rotation || this.rotation;
    }
    translate(translation) {
        this.translation.x += translation.x;
        this.translation.y += translation.y;
    }
    zoomInto(center, zoom) {
        this.zoom *= zoom;
        this.translation.x = center.x + (this.translation.x - center.x) * zoom;
        this.translation.y = center.y + (this.translation.y - center.y) * zoom;
    }
    rotateAround(center, angle) {
        this.rotation += angle;
        let diff = { x: this.translation.x - center.x, y: this.translation.y - center.y };
        this.translation.x = center.x + diff.x * Math.cos(angle) - diff.y * Math.sin(angle);
        this.translation.y = center.y + diff.x * Math.sin(angle) + diff.y * Math.cos(angle);
    }
    lerp(transform, t) {
        let lerp = (a, b) => t * b + (1 - t) * a;
        this.translation.x = lerp(this.translation.x, transform.translation.x);
        this.translation.y = lerp(this.translation.y, transform.translation.y);
        this.zoom = lerp(this.zoom, transform.zoom);
        this.rotation = lerp(this.rotation, transform.rotation);
    }
}
export default class RenderSpace {
    constructor(arg) {
        this._listeners = [];
        this.config = {
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
        let ctx = arg instanceof HTMLCanvasElement ? arg.getContext("2d") : arg;
        if (ctx === null)
            throw new Error("Failed to get CanvasRenderingContext2D");
        this.ctx = ctx;
        this.transform = new Transform();
        this.target_transform = new Transform();
        this.canvas.style.touchAction = "none";
        event_listeners(this, this.canvas);
    }
    updateDamping(dt, update_transform = true) {
        this.transform.lerp(this.target_transform, 1 - Math.exp(-dt / this.config.damping_strength));
        if (update_transform)
            this.updateTransform();
    }
    updateTransform() {
        if (this.config.damping_strength === 0) {
            this.transform = structuredClone(this.target_transform);
        }
        this.ctx.resetTransform();
        this.ctx.translate(this.transform.translation.x, this.transform.translation.y);
        this.ctx.rotate(this.transform.rotation);
        this.ctx.scale(this.transform.zoom, this.transform.zoom);
        this._listeners.forEach(listener => listener(this));
    }
    translate(translation) {
        this.target_transform.translate(translation);
    }
    zoomInto(center, zoom) {
        this.target_transform.zoomInto(center, zoom);
    }
    rotateAround(center, angle) {
        this.target_transform.rotateAround(center, angle);
    }
    lerp(transform, t) {
        this.target_transform.lerp(transform, t);
    }
    addListener(listener) {
        this._listeners.push(listener);
    }
    removeListener(listener) {
        this._listeners.splice(this._listeners.indexOf(listener), 1);
    }
    clearScreen() {
        this.ctx.save();
        this.ctx.resetTransform();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }
    get canvas() {
        return this.ctx.canvas;
    }
    get listeners() {
        return this._listeners.slice();
    }
}
function event_listeners(space, canvas) {
    let pointers = {};
    canvas.addEventListener("contextmenu", event => event.preventDefault());
    canvas.addEventListener("pointerdown", event => {
        pointers[event.pointerId] = { x: event.pageX, y: event.pageY, button: event.button };
    });
    canvas.addEventListener("pointerup", event => {
        delete pointers[event.pointerId];
    });
    canvas.addEventListener("pointermove", event => {
        const pointer = pointers[event.pointerId];
        if (!pointer)
            return;
        let last = {
            x: pointer.x,
            y: pointer.y
        };
        pointer.x = event.pageX;
        pointer.y = event.pageY;
        switch (Object.keys(pointers).length) {
            case 1:
                if (pointer.button === 2 && space.config.rotating) {
                    space.rotateAround({ x: canvas.width / 2, y: canvas.height / 2 }, space.config.rotation_sensitivity * (pointer.x - last.x));
                }
                if (pointer.button == 0 && space.config.panning) {
                    space.translate({
                        x: pointer.x - last.x,
                        y: pointer.y - last.y
                    });
                }
                space.updateTransform();
                break;
            case 2:
                const anchor = Object.values(pointers).find(p => p !== pointer);
                if (!anchor)
                    throw new Error("something is really wrong bro, good luck debugging ts");
                let center = {
                    x: (pointer.x + anchor.x) / 2,
                    y: (pointer.y + anchor.y) / 2
                };
                if (space.config.panning) {
                    space.translate({
                        x: (pointer.x - last.x) / 2,
                        y: (pointer.y - last.y) / 2
                    });
                }
                if (space.config.zooming) {
                    let dist = Math.hypot(pointer.x - anchor.x, pointer.y - anchor.y);
                    let last_dist = Math.hypot(last.x - anchor.x, last.y - anchor.y);
                    space.zoomInto({ x: center.x, y: center.y }, dist / last_dist);
                }
                if (space.config.rotating) {
                    let angle = Math.atan2(pointer.y - anchor.y, pointer.x - anchor.x);
                    let last_angle = Math.atan2(last.y - anchor.y, last.x - anchor.x);
                    space.rotateAround({ x: center.x, y: center.y }, angle - last_angle);
                }
                space.updateTransform();
                break;
        }
    });
    canvas.addEventListener("wheel", event => {
        if (!space.config.zooming)
            return;
        let zoom = Math.pow(space.config.scroll_sensitivity, -event.deltaY);
        space.zoomInto({ x: event.pageX, y: event.pageY }, zoom);
        space.updateTransform();
        event.preventDefault();
    }, { passive: false });
}
