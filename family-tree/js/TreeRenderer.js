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

            // Calculate the midpoint between parents for the connection line
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

        // SPOUSE LINKS - Handle multiple spouses
        const drawnPairs = new Set();
        
        data.forEach(node => {
            if (node.x === undefined) return;
            
            // Check for multiple spouses (comma-separated)
            if (node.SpouseID) {
                const spouseIDs = node.SpouseID.split(',').map(s => s.trim());
                const spouseStatuses = node.SpouseStatus ? node.SpouseStatus.split(',').map(s => s.trim()) : [];
                
                spouseIDs.forEach((spouseID, index) => {
                    const spouse = this.dataManager.findPerson(spouseID);
                    if (!spouse || spouse.x === undefined) return;

                    const key = [node.ID, spouseID].sort().join("-");
                    if (drawnPairs.has(key)) return;
                    drawnPairs.add(key);

                    const status = spouseStatuses[index] || 'married';
                    const y = node.y + CONFIG.node.height / 2;
                    const x1 = node.x + CONFIG.node.width;
                    const x2 = spouse.x;

                    // Different styles based on marriage status
                    let strokeColor = '#FF6B6B';  // Default red for married
                    let strokeDash = "none";
                    let strokeWidth = 3;
                    
                    if (status === 'divorced') {
                        strokeColor = '#FFB6B6';  // Pink
                        strokeDash = "5,5";  // Dashed line
                    } else if (status === 'widowed' || status === 'deceased') {
                        strokeColor = '#999999';  // Gray
                    } else if (status === 'separated') {
                        strokeColor = '#FFB6B6';  // Pink
                        strokeDash = "2,2";  // Short dashes
                    }

                    links.append("line")
                        .attr("x1", x1)
                        .attr("y1", y)
                        .attr("x2", x2)
                        .attr("y2", y)
                        .attr("stroke", strokeColor)
                        .attr("stroke-width", strokeWidth)
                        .attr("stroke-dasharray", strokeDash);
                });
            }
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
            .attr("fill", d => {
                // Check if person has any current marriage (not divorced)
                if (d.SpouseID && d.SpouseStatus) {
                    const statuses = d.SpouseStatus.split(',').map(s => s.trim());
                    const hasCurrentMarriage = statuses.some(s => s === 'married');
                    return hasCurrentMarriage ? "url(#marriedGradient)" : "url(#singleGradient)";
                }
                return d.SpouseID ? "url(#marriedGradient)" : "url(#singleGradient)";
            })
            .attr("stroke", CONFIG.colors.defaultStroke)
            .attr("stroke-width", CONFIG.node.strokeWidth)
            .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.15))");

        // Name text
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

        // Add indicator for multiple marriages
        nodeGroups.each(function(d) {
            if (d.SpouseID && d.SpouseID.includes(',')) {
                const spouseCount = d.SpouseID.split(',').length;
                const g = d3.select(this);
                
                // Add a small badge
                g.append("circle")
                    .attr("cx", CONFIG.node.width - 12)
                    .attr("cy", 12)
                    .attr("r", 10)
                    .attr("fill", "#ff9800")
                    .attr("stroke", "white")
                    .attr("stroke-width", 2);
                
                g.append("text")
                    .attr("x", CONFIG.node.width - 12)
                    .attr("y", 16)
                    .attr("text-anchor", "middle")
                    .attr("fill", "white")
                    .attr("font-size", "11px")
                    .attr("font-weight", "bold")
                    .style("pointer-events", "none")
                    .text(spouseCount);
            }
        });
    }

    // Search and highlight functionality
    searchAndHighlight(searchTerm) {
        // Clear previous highlights
        this.clearHighlights();
        
        if (!searchTerm || searchTerm.trim() === '') {
            return [];
        }
        
        const term = searchTerm.toLowerCase().trim();
        const matches = [];
        
        // Search through all nodes
        this.mainGroup.selectAll('.node').each(function(d) {
            const nameMatch = d.Name.toLowerCase().includes(term);
            const yearMatch = d.BirthYear && d.BirthYear.toString().includes(term);
            
            if (nameMatch || yearMatch) {
                matches.push(d);
                
                // Highlight matching node
                d3.select(this).select('rect')
                    .classed('search-highlight', true)
                    .attr('stroke', '#FFD700')
                    .attr('stroke-width', 5);
            }
        });
        
        return matches;
    }
    
    // Clear all search highlights
    clearHighlights() {
        this.mainGroup.selectAll('.node rect')
            .classed('search-highlight', false)
            .attr('stroke', CONFIG.colors.defaultStroke)
            .attr('stroke-width', CONFIG.node.strokeWidth);
            
        // Restore selected node highlight if there was one
        if (this.selectedNode) {
            const self = this;
            this.mainGroup.selectAll('.node').each(function(d) {
                if (d.ID === self.selectedNode.ID) {
                    d3.select(this).select('rect')
                        .attr('stroke', CONFIG.colors.selectedStroke)
                        .attr('stroke-width', CONFIG.node.selectedStrokeWidth);
                }
            });
        }
    }
    
    // Focus the view on a specific node
    focusOnNode(node) {
        if (!node || node.x === undefined || node.y === undefined) return;
        
        const svg = this.svg;
        const container = document.getElementById('tree-container');
        const bounds = container.getBoundingClientRect();
        
        // Calculate center position
        const centerX = bounds.width / 2;
        const centerY = bounds.height / 2;
        
        // Calculate translation to center the node
        const nodeX = node.x + CONFIG.node.width / 2;
        const nodeY = node.y + CONFIG.node.height / 2;
        
        // Set a reasonable zoom level (1.5x)
        const scale = 1.5;
        
        // Create the transform
        const transform = d3.zoomIdentity
            .translate(centerX, centerY)
            .scale(scale)
            .translate(-nodeX, -nodeY);
        
        // Apply the transform with animation
        svg.transition()
            .duration(750)
            .call(d3.zoom().transform, transform);
    }
    
    // Handle window resize
    handleResize() {
        const container = document.getElementById('tree-container');
        if (!container) return;
        
        const bounds = container.getBoundingClientRect();
        
        // Update SVG dimensions
        this.svg
            .attr("width", bounds.width - 40)  // Account for padding
            .attr("height", Math.max(600, bounds.height - 40));
    }
}