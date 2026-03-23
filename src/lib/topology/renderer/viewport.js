// ============================================================
//  VIEWPORT MANAGER
//  Pan, zoom, and coordinate transforms.
//  Pure class — no React, no DOM, no canvas API.
// ============================================================

export class ViewportManager {
  constructor() {
    this.panX    = 0;
    this.panY    = 0;
    this.zoom    = 1;
    this.minZoom = 0.04;
    this.maxZoom = 10;
    this._w      = 0;
    this._h      = 0;
  }

  /**
   * Set the canvas size so fit/zoom operations stay centered.
   * @param {number} w
   * @param {number} h
   */
  setSize(w, h) {
    this._w = w;
    this._h = h;
  }

  /**
   * Convert a screen pixel to a world coordinate.
   * @param {number} sx
   * @param {number} sy
   * @returns {{ x: number, y: number }}
   */
  toWorld(sx, sy) {
    return {
      x: (sx - this.panX) / this.zoom,
      y: (sy - this.panY) / this.zoom,
    };
  }

  /**
   * Convert a world coordinate to a screen pixel.
   * @param {number} wx
   * @param {number} wy
   * @returns {{ x: number, y: number }}
   */
  toScreen(wx, wy) {
    return {
      x: wx * this.zoom + this.panX,
      y: wy * this.zoom + this.panY,
    };
  }

  /**
   * Zoom toward a screen-space focal point.
   * @param {number} factor  multiplier (e.g. 1.1 to zoom in)
   * @param {number} [sx]    focal point x (defaults to canvas centre)
   * @param {number} [sy]    focal point y
   */
  zoomAt(factor, sx, sy) {
    const cx = sx ?? this._w / 2;
    const cy = sy ?? this._h / 2;
    const nz = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * factor));
    this.panX = cx - (cx - this.panX) * (nz / this.zoom);
    this.panY = cy - (cy - this.panY) * (nz / this.zoom);
    this.zoom = nz;
  }

  /**
   * Fit a world bounding box into the viewport with padding.
   * @param {{ x, y, width, height }} bbox
   * @param {number} padding
   */
  fitToBBox(bbox, padding = 80) {
    if (bbox.width === 0 && bbox.height === 0) return;
    const cw = bbox.width  + padding * 2;
    const ch = bbox.height + padding * 2;
    this.zoom = Math.min(this._w / cw, this._h / ch, this.maxZoom);
    const cx  = bbox.x + bbox.width  / 2;
    const cy  = bbox.y + bbox.height / 2;
    this.panX = this._w / 2 - cx * this.zoom;
    this.panY = this._h / 2 - cy * this.zoom;
  }

  /**
   * Pan by a screen-space delta.
   * @param {number} dx
   * @param {number} dy
   */
  pan(dx, dy) {
    this.panX += dx;
    this.panY += dy;
  }

  /** Reset pan and zoom to defaults. */
  reset() {
    this.panX = 0;
    this.panY = 0;
    this.zoom = 1;
  }

  /**
   * Apply the viewport transform to a canvas context.
   * Call inside ctx.save() / ctx.restore().
   * @param {CanvasRenderingContext2D} ctx
   */
  apply(ctx) {
    ctx.setTransform(this.zoom, 0, 0, this.zoom, this.panX, this.panY);
  }

  /** Zoom as a percentage string. */
  get zoomPercent() {
    return Math.round(this.zoom * 100);
  }
}
