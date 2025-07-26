import { vec2 } from "gl-matrix";
import RenderSpace from "movable-render-space";

window.onerror = (msg, src, line, col, err) => {
    alert(`${msg}\nat ${src}:${line},${col}`);
    alert(`${err}`);
    return true;
};

const canvases: HTMLCanvasElement[] = Array.from(document.getElementsByTagName("canvas"));
const spaces = canvases.map(canvas => new RenderSpace(canvas));

canvases.forEach(canvas => {
    canvas.width = 2/3 * window.innerWidth;
    canvas.height = 2/3 * window.innerHeight;
});

for (let space of spaces) {
    space.config.damping_strength = 0.05;
    space.canvas.ondblclick = event => {
        alert(vec2.str(space.screenToRenderSpace(vec2.fromValues(event.offsetX, event.offsetY))));
    };
}

let last_frame = Date.now();
function render() {
    for (let space of spaces) {
        space.clearScreen();
        space.updateDamping((Date.now() - last_frame) / 1000);

        space.ctx.fillStyle = "white";
        space.ctx.fillRect(100, 100, 100, 100);

        // don't do it like this, this is just to test renderSpaceToScreen
        space.ctx.resetTransform();
        let a = space.renderSpaceToScreen(vec2.fromValues(100, 300));
        let b = space.renderSpaceToScreen(vec2.fromValues(100, 400));
        let c = space.renderSpaceToScreen(vec2.fromValues(200, 400));
        let d = space.renderSpaceToScreen(vec2.fromValues(200, 300));
        space.ctx.beginPath();
        space.ctx.moveTo(a[0], a[1]);
        space.ctx.lineTo(b[0], b[1]);
        space.ctx.lineTo(c[0], c[1]);
        space.ctx.lineTo(d[0], d[1]);
        space.ctx.fill();
    }

    last_frame = Date.now();
    requestAnimationFrame(render);
}
requestAnimationFrame(render);
