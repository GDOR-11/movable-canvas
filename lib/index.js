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
                break;
        }
    });
    canvas.addEventListener("wheel", event => {
        if (!space.config.zooming)
            return;
        let zoom = Math.pow(space.config.scroll_sensitivity, -event.deltaY);
        space.zoomInto({ x: event.pageX, y: event.pageY }, zoom);
        event.preventDefault();
    }, { passive: false });
}
export class RenderSpace {
    constructor(canvas, ctx) {
        var _a;
        this._zoom = 1;
        this._offset = { x: 0, y: 0 };
        this._rotation = 0;
        this.config = Object.seal({
            /** value in the rage (1, ∞) determining the zoom speed of the scrollwheel */
            scroll_sensitivity: 1.01,
            /** value in the range (0, ∞) determining the sensitivity of the rotation */
            rotation_sensitivity: 0.01,
            panning: true,
            zooming: true,
            rotating: true
        });
        this._canvas = canvas;
        ctx = (_a = ctx !== null && ctx !== void 0 ? ctx : canvas.getContext("2d")) !== null && _a !== void 0 ? _a : undefined;
        if (ctx === undefined)
            throw new Error("Failed to get canvas context. If you've already called canvas.getContext, pass it as second argument.");
        this._ctx = ctx;
        canvas.style.touchAction = "none";
        event_listeners(this, canvas);
        this.updateTransform();
        let updateTransform = this.updateTransform.bind(this);
        this.offset_proxy = new Proxy(this._offset, {
            set(target, prop, value) {
                let success = Reflect.set(target, prop, value);
                updateTransform();
                return success;
            }
        });
    }
    updateTransform() {
        this._ctx.resetTransform();
        this._ctx.translate(this._offset.x, this._offset.y);
        this._ctx.rotate(this._rotation);
        this._ctx.scale(this._zoom, this._zoom);
    }
    translate(translation) {
        this._offset.x += translation.x;
        this._offset.y += translation.y;
        this.updateTransform();
    }
    zoomInto(center, zoom) {
        this._zoom *= zoom;
        this._offset.x = center.x + (this.offset.x - center.x) * zoom;
        this._offset.y = center.y + (this.offset.y - center.y) * zoom;
        this.updateTransform();
    }
    rotateAround(center, angle) {
        this._rotation += angle;
        let diff = { x: this.offset.x - center.x, y: this.offset.y - center.y };
        this._offset.x = center.x + diff.x * Math.cos(angle) - diff.y * Math.sin(angle);
        this._offset.y = center.y + diff.x * Math.sin(angle) + diff.y * Math.cos(angle);
        this.updateTransform();
    }
    clearScreen() {
        this._ctx.save();
        this._ctx.resetTransform();
        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        this._ctx.restore();
    }
    // getter and setter spam
    get canvas() {
        return this._canvas;
    }
    get ctx() {
        return this._ctx;
    }
    get zoom() {
        return this._zoom;
    }
    set zoom(value) {
        this._zoom = value;
        this.updateTransform();
    }
    get offset() {
        return this.offset_proxy;
    }
    set offset(value) {
        this._offset.x = value.x;
        this._offset.y = value.y;
        this.updateTransform();
    }
    get rotation() {
        return this._rotation;
    }
    set rotation(value) {
        this._rotation = value;
        this.updateTransform();
    }
}
