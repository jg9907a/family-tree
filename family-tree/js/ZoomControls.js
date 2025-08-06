// js/ZoomControls.js

import { CONFIG } from './config.js';

export class ZoomControls {
    constructor(svg) {
        this.svg = svg;
        this.mainGroup = null; // Will be set later
        this.zoom = d3.zoom()
            .scaleExtent([CONFIG.zoom.min, CONFIG.zoom.max])
            .on("zoom", (event) => {
                if (this.mainGroup) {
                    this.mainGroup.attr("transform", event.transform);
                }
            });
        this.svg.call(this.zoom);
    }

    setMainGroup(mainGroup) {
        this.mainGroup = mainGroup;
    }

    zoomIn() {
        this.svg.transition().duration(CONFIG.animation.duration.medium).call(this.zoom.scaleBy, CONFIG.zoom.inFactor);
    }

    zoomOut() {
        this.svg.transition().duration(CONFIG.animation.duration.medium).call(this.zoom.scaleBy, CONFIG.zoom.outFactor);
    }

    reset() {
        this.svg.transition().duration(CONFIG.animation.duration.long).call(this.zoom.transform, d3.zoomIdentity);
    }

    autoFit(bounds) {
        if (!bounds || bounds.width === 0) return;
        const { width, height } = CONFIG.svg;
        const scale = Math.min(0.9, (width - 100) / bounds.width, (height - 100) / bounds.height);
        const transform = d3.zoomIdentity
            .translate(width / 2 - scale * (bounds.x + bounds.width / 2), height / 2 - scale * (bounds.y + bounds.height / 2))
            .scale(scale);
        this.svg.transition().duration(CONFIG.animation.duration.extraLong).call(this.zoom.transform, transform);
    }

    setupKeyboardControls(container) {
        d3.select(container).on('keydown', (event) => {
            switch(event.key) {
                case '+': case '=': this.zoomIn(); break;
                case '-': this.zoomOut(); break;
                case '0': this.reset(); break;
                case 'f': case 'F': this.autoFit(this.getBounds()); break;
            }
        });
    }

    getBounds() {
        return this.mainGroup ? this.mainGroup.node().getBBox() : null;
    }
}