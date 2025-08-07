// js/TreeRenderer.js

import { CONFIG } from './config.js';

export class TreeRenderer {
    constructor(svg, dataManager) {
        this.svg = svg;
        this.dataManager = dataManager;
        this.mainGroup = null;
        this.selectedNode = null;
        this.onNodeSelect = null;
    }

    setNodeSelectCallback(callback) {
        this.onNodeSelect = callback;
    }

    render() {
        this.initializeSVG();

        const container = document.getElementById('tree-container');
        const bounds = container.getBoundingClientRect();
        const data = this.dataManager.positionNodes(bounds.width);

        if (!data || data.length === 0) return this.mainGroup;

        this.drawLinks(this.mainGroup, data);
        this.drawNodes(this.mainGroup, data);

        return this.mainGroup;
    }

    initializeSVG() {
        const container = document.getElementById('tree-container');
        const bounds = container.getBoundingClientRect();

        this.svg
            .attr("width", bounds.width)
            .attr("height", bounds.height);

        this.svg.selectAll("*").remove();

        this.mainGroup = this.svg
            .append("g")
            .attr("transform", `translate(${CONFIG.spacing.margin},${CONFIG.spacing.margin})`);

        this.createGradients();
    }

    createGradients() {
        const defs = this.mainGroup.append("defs");

        const singleGradient = defs.append("linearGradient")
            .attr("id", "singleGradient")
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "100%").attr("y2", "100%");
        singleGradient.append("stop").attr("offset", "0%").attr("stop-color", CONFIG.colors.singleGradient.start);
        singleGradient.append("stop").attr("offset", "100%").attr("stop-color", CONFIG.colors.singleGradient.end);

        const marriedGradient = defs.append("linearGradient")
            .attr("id", "marriedGradient")
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "100%").attr("y2", "100%");
        marriedGradient.append("stop").attr("offset", "0%").attr("stop-color", CONFIG.colors.marriedGradient.start);
        marriedGradient.append("stop").attr("offset", "100%").attr("stop-color", CONFIG.colors.marriedGradient.end);
    }

    drawLinks(container, data) {
        const links = container.append("g").attr("class", "links");

        // Parent-child links
        data.filter(n => n.hasParents).forEach(child => {
            const parents = this.dataManager.getParents(child);
            if (parents.length === 0) return;

            const childX = child.x + CONFIG.node.width / 2;
            const childY = child.y;

            const parentY = parents[0].y + CONFIG.node.height;
            const midY = (parentY + childY) / 2;

            // **FIX**: Calculate the midpoint between parents for the connection line
            let parentMidX;
            if (parents.length === 2) {
                const [p1, p2] = parents.sort((a,b) => a.x - b.x);
                parentMidX = (p1.x + CONFIG.node.width + p2.x) / 2;
            } else {
                parentMidX = parents[0].x + CONFIG.node.width / 2;
            }

            links.append("path")
                .attr("d", `M ${parentMidX},${parentY} L ${parentMidX},${midY} L ${childX},${midY} L ${childX},${childY}`)
                .attr("stroke", CONFIG.colors.parentChildLine)
                .attr("stroke-width", 2.5)
                .attr("fill", "none");
        });

        // Spouse links
        const drawnPairs = new Set();
        data.forEach(node => {
            const spouse = this.dataManager.getSpouse(node);
            if (!spouse || node.x === undefined || spouse.x === undefined) return;

            const key = [node.ID, spouse.ID].sort().join("-");
            if (drawnPairs.has(key)) return;
            drawnPairs.add(key);

            const y = node.y + CONFIG.node.height / 2;
            const x1 = node.x + CONFIG.node.width;
            const x2 = spouse.x;

            links.append("line")
                .attr("x1", x1)
                .attr("y1", y)
                .attr("x2", x2)
                .attr("y2", y)
                .attr("stroke", CONFIG.colors.marriageLine)
                .attr("stroke-width", 3);
        });
    }

    drawNodes(container, data) {
        const self = this;
        const nodeGroups = container.selectAll(".node")
            .data(data.filter(d => d.x !== undefined && d.y !== undefined), d => d.ID)
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .style("cursor", "pointer")
            .on("click", function (event, d) {
                event.stopPropagation();
                self.selectedNode = d;

                container.selectAll(".node rect")
                    .attr("stroke", CONFIG.colors.defaultStroke)
                    .attr("stroke-width", CONFIG.node.strokeWidth);

                d3.select(this).select("rect")
                    .attr("stroke", CONFIG.colors.selectedStroke)
                    .attr("stroke-width", CONFIG.node.selectedStrokeWidth);

                if (self.onNodeSelect) self.onNodeSelect(d);
            });

        // Node rectangles
        nodeGroups.append("rect")
            .attr("width", CONFIG.node.width)
            .attr("height", CONFIG.node.height)
            .attr("rx", CONFIG.node.borderRadius)
            .attr("fill", d => d.hasSpouse ? "url(#marriedGradient)" : "url(#singleGradient)")
            .attr("stroke", CONFIG.colors.defaultStroke)
            .attr("stroke-width", CONFIG.node.strokeWidth)
            .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.15))");

        const nameText = nodeGroups.append("text")
            .attr("x", CONFIG.node.width / 2)
            .attr("y", CONFIG.node.height / 2 + CONFIG.text.nameOffset)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-weight", "600")
            .style("pointer-events", "none")
            .text(d => d.Name);

        // Auto-scale font size down to fit width
        nameText.each(function(d) {
            const textEl = d3.select(this);
            let fontSize = CONFIG.text.nameFontSize;
            const maxWidth = CONFIG.node.width - 10;

            while (this.getComputedTextLength() > maxWidth && fontSize > 8) {
                fontSize -= 1;
                textEl.attr("font-size", `${fontSize}px`);
            }
        });


        // Birth year
        nodeGroups.append("text")
            .attr("x", CONFIG.node.width / 2)
            .attr("y", CONFIG.node.height / 2 + CONFIG.text.yearOffset)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", `${CONFIG.text.yearFontSize}px`)
            .attr("opacity", 0.9)
            .style("pointer-events", "none")
            .text(d => d.BirthYear ? `b. ${d.BirthYear}` : "");
    }
}
