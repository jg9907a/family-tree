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

    getBounds() {
        return this.mainGroup ? this.mainGroup.node().getBBox() : null;
    }

    render() {
        this._initializeSVG();
        const data = this.dataManager.getData();
        if (!data || data.length === 0) return this.mainGroup;

        const positionedData = this._calculatePositions(data);
        this._drawLinks(this.mainGroup, positionedData);
        this._drawNodes(this.mainGroup, positionedData);
        return this.mainGroup;
    }

    _initializeSVG() {
        this.svg.attr("width", CONFIG.svg.width).attr("height", CONFIG.svg.height);
        this.svg.selectAll("*").remove();
        this.mainGroup = this.svg.append("g");
        this._createGradients();
    }

    _createGradients() {
        const defs = this.mainGroup.append("defs");
        // Single person gradient
        const single = defs.append("linearGradient").attr("id", "singleGradient").attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "100%");
        single.append("stop").attr("offset", "0%").attr("stop-color", CONFIG.colors.singleGradient.start);
        single.append("stop").attr("offset", "100%").attr("stop-color", CONFIG.colors.singleGradient.end);
        // Married person gradient
        const married = defs.append("linearGradient").attr("id", "marriedGradient").attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "100%");
        married.append("stop").attr("offset", "0%").attr("stop-color", CONFIG.colors.marriedGradient.start);
        married.append("stop").attr("offset", "100%").attr("stop-color", CONFIG.colors.marriedGradient.end);
    }

    _calculatePositions(data) {
        const generations = d3.group(data, d => d.generation);
        const maxGeneration = Math.max(...Array.from(generations.keys()));

        // Position nodes from the bottom up for a more stable layout
        for (let i = maxGeneration; i >= 0; i--) {
            const genData = generations.get(i) || [];
            let processedNodes = new Set();
            
            genData.forEach(node => {
                if (processedNodes.has(node.ID)) return;
                
                node.y = node.generation * CONFIG.spacing.generation;

                const children = this.dataManager.getChildren(node.ID);
                if (children.length > 0) {
                    // Position parent based on the center of their children
                    let childrenX = children.map(c => c.x + CONFIG.node.width / 2);
                    let avgChildX = d3.mean(childrenX);
                    node.x = avgChildX - CONFIG.node.width / 2;
                    
                    if (node.hasSpouse) {
                         let spouseNode = this.dataManager.getSpouse(node);
                         if(spouseNode && !processedNodes.has(spouseNode.ID)){
                              // Position spouse relative to the parent
                              spouseNode.x = node.x - CONFIG.node.width - CONFIG.spacing.couple;
                              if (node.x < spouseNode.x) { // Ensure correct order
                                  [node.x, spouseNode.x] = [spouseNode.x, node.x];
                              }
                              spouseNode.y = node.y;
                              processedNodes.add(spouseNode.ID);
                         }
                    }
                }
                processedNodes.add(node.ID);
            });
        }
        
        // Final pass to prevent overlaps in bottom generation
        const bottomGen = generations.get(maxGeneration) || [];
        let xOffset = 0;
        bottomGen.forEach(node => {
            node.x = xOffset;
            xOffset += CONFIG.node.width + CONFIG.spacing.family;
        });

        // Center the whole tree
        const allX = data.map(n => n.x).filter(x => x !== undefined);
        const minX = d3.min(allX);
        const maxX = d3.max(allX) + CONFIG.node.width;
        const treeWidth = maxX - minX;
        const centeringOffset = (CONFIG.svg.width - treeWidth) / 2 - minX;
        
        data.forEach(node => {
            if (node.x !== undefined) {
               node.x += centeringOffset;
            }
        });

        return data;
    }
    
    _drawLinks(container, data) {
        const links = container.append("g").attr("class", "links");
        
        // Parent-child links
        data.filter(n => n.hasParents).forEach(child => {
            const parents = this.dataManager.getParents(child);
            if (parents.length !== 2) return;
            const [p1, p2] = parents;
            
            const parentMidX = (p1.x + p2.x + CONFIG.node.width) / 2;
            const parentY = p1.y + CONFIG.node.height;
            const childMidX = child.x + CONFIG.node.width / 2;
            const childY = child.y;

            const path = d3.path();
            path.moveTo(parentMidX, parentY);
            path.bezierCurveTo(parentMidX, parentY + 70, childMidX, childY - 70, childMidX, childY);
            
            links.append("path").attr("d", path).attr("stroke", CONFIG.colors.parentChildLine).attr("stroke-width", 2.5).attr("fill", "none");
        });

        // Spouse links
        data.filter(n => n.hasSpouse).forEach(node => {
            const spouse = this.dataManager.getSpouse(node);
            if (spouse && data.indexOf(node) < data.indexOf(spouse)) {
                const startX = node.x > spouse.x ? node.x : spouse.x;
                const endX = node.x < spouse.x ? node.x + CONFIG.node.width : spouse.x + CONFIG.node.width;
                const y = node.y + CONFIG.node.height / 2;

                const path = d3.path();
                path.moveTo(startX, y);
                path.quadraticCurveTo((startX + endX) / 2, y - 30, endX, y);

                links.append("path").attr("d", path).attr("stroke", CONFIG.colors.marriageLine).attr("stroke-width", 3).attr("fill", "none");
            }
        });
    }

    _drawNodes(container, data) {
        const nodeGroups = container.selectAll(".node").data(data.filter(d=>d.x !== undefined), d => d.ID).enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .style("cursor", "pointer")
            .on("click", (event, d) => {
                event.stopPropagation();
                this.selectedNode = d;
                nodeGroups.selectAll("rect").attr("stroke", CONFIG.colors.defaultStroke).attr("stroke-width", CONFIG.node.strokeWidth);
                d3.select(event.currentTarget).select("rect").attr("stroke", CONFIG.colors.selectedStroke).attr("stroke-width", CONFIG.node.selectedStrokeWidth);
                if (this.onNodeSelect) this.onNodeSelect(d);
            });

        nodeGroups.append("rect").attr("width", CONFIG.node.width).attr("height", CONFIG.node.height).attr("rx", CONFIG.node.borderRadius)
            .attr("fill", d => d.hasSpouse ? "url(#marriedGradient)" : "url(#singleGradient)")
            .attr("stroke", CONFIG.colors.defaultStroke).attr("stroke-width", CONFIG.node.strokeWidth)
            .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.15))");
        nodeGroups.append("text").attr("x", CONFIG.node.width / 2).attr("y", CONFIG.node.height / 2 + CONFIG.text.nameOffset).attr("text-anchor", "middle").attr("fill", "white").attr("font-size", `${CONFIG.text.nameFontSize}px`).attr("font-weight", "600").style("pointer-events", "none").text(d => d.Name);
        nodeGroups.append("text").attr("x", CONFIG.node.width / 2).attr("y", CONFIG.node.height / 2 + CONFIG.text.yearOffset).attr("text-anchor", "middle").attr("fill", "white").attr("font-size", `${CONFIG.text.yearFontSize}px`).attr("opacity", 0.9).style("pointer-events", "none").text(d => d.BirthYear ? `b. ${d.BirthYear}` : "");
    }
}