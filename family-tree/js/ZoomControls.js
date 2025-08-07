// js/ZoomControls.js

import { CONFIG } from './config.js';

export class ZoomControls {
    constructor(svg, mainGroup) {
        this.svg = svg;
        this.mainGroup = mainGroup;
        this.currentTransform = d3.zoomIdentity;
        this.zoom = null;
        
        this.initializeZoom();
    }
    
    /**
     * Initialize D3 zoom behavior.
     * **FIX**: This version uses the modern D3 `wheelDelta` method to conditionally
     * control zooming. This is more robust than using only the filter function.
     */
    initializeZoom() {
        this.zoom = d3.zoom()
            .scaleExtent([CONFIG.zoom.min, CONFIG.zoom.max])
            .on("zoom", (event) => this.handleZoom(event));

        // Filter is now only responsible for blocking pans that start on nodes.
        this.zoom.filter((event) => {
            // Prevent pan from starting when clicking directly on a person's node.
            if (event.type === 'mousedown' && event.target.closest('.node')) {
                return false;
            }
            // Standard D3 check to allow panning with the primary mouse button only.
            return !event.button;
        });

        // wheelDelta controls the zoom speed and can be used to disable zoom.
        // If the ctrlKey is not pressed, we return 0, which prevents zooming.
        this.zoom.wheelDelta((event) => {
            return (event.ctrlKey || event.metaKey) 
                ? -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) 
                : 0;
        });
        
        this.svg.call(this.zoom);
        
        // Double-click on empty space to reset the view
        this.svg.on("dblclick.zoom", () => this.reset());
    }
    
    /**
     * Handle zoom events from D3.
     * This function applies the calculated transformation to the main group.
     */
    handleZoom(event) {
        this.mainGroup.attr("transform", event.transform);
        this.currentTransform = event.transform;
    }
    
    /**
     * Zoom in using D3's built-in scaling for a smooth, centered zoom.
     */
    zoomIn() {
        this.svg.transition()
            .duration(CONFIG.animation.duration.medium)
            .call(this.zoom.scaleBy, CONFIG.zoom.inFactor);
    }
    
    /**
     * Zoom out using D3's built-in scaling.
     */
    zoomOut() {
        this.svg.transition()
            .duration(CONFIG.animation.duration.medium)
            .call(this.zoom.scaleBy, CONFIG.zoom.outFactor);
    }
    
    /**
     * Auto-fit the tree to the viewport.
     */
    autoFit() {
        try {
            const bbox = this.mainGroup.node().getBBox();
            if (bbox.width === 0 || bbox.height === 0) return;
            
            // Get dimensions from the SVG element itself for responsiveness.
            const fullWidth = this.svg.attr("width");
            const fullHeight = this.svg.attr("height");
            const margin = 100; // Keep a margin around the tree
            const width = fullWidth - margin;
            const height = fullHeight - margin;
            
            const midX = bbox.x + bbox.width / 2;
            const midY = bbox.y + bbox.height / 2;
            
            const scale = Math.min(width / bbox.width, height / bbox.height, 1);
            const translate = [
                fullWidth / 2 - scale * midX,
                fullHeight / 2 - scale * midY
            ];
            
            const transform = d3.zoomIdentity
                .translate(translate[0], translate[1])
                .scale(scale);
            
            this.svg.transition()
                .duration(CONFIG.animation.duration.extraLong)
                .call(this.zoom.transform, transform);
                
        } catch (error) {
            console.error("Auto-fit failed:", error);
        }
    }
    
    /**
     * Reset zoom to the default identity transform.
     */
    reset() {
        this.svg.transition()
            .duration(CONFIG.animation.duration.long)
            .call(this.zoom.transform, d3.zoomIdentity);
    }
    
    /**
     * Pan the view programmatically.
     */
    pan(dx, dy) {
        this.svg.transition()
            .duration(CONFIG.animation.duration.short)
            .call(this.zoom.translateBy, dx, dy);
    }
    
    /**
     * Setup keyboard navigation for panning and zooming.
     */
    setupKeyboardControls(container) {
        container.setAttribute('tabindex', '0');
        container.style.outline = 'none';
        
        container.addEventListener('keydown', (event) => {
            // Prevent default browser actions for these keys
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '0', 'f', 'F'].includes(event.key)) {
                event.preventDefault();
            }

            const panSpeed = CONFIG.zoom.panSpeed;
            switch(event.key) {
                case 'ArrowLeft':
                    this.pan(panSpeed, 0);
                    break;
                case 'ArrowRight':
                    this.pan(-panSpeed, 0);
                    break;
                case 'ArrowUp':
                    this.pan(0, panSpeed);
                    break;
                case 'ArrowDown':
                    this.pan(0, -panSpeed);
                    break;
                case '+':
                case '=':
                    this.zoomIn();
                    break;
                case '-':
                    this.zoomOut();
                    break;
                case '0':
                    this.reset();
                    break;
                case 'f':
                case 'F':
                    this.autoFit();
                    break;
            }
        });
    }
}
