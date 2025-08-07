// js/DataManager.js - FIXED for multiple spouses

import { SAMPLE_DATA, CONFIG } from './config.js';

export class DataManager {
    constructor() {
        this.familyData = [];
    }

    async loadFromURL(url) {
        if (!url) return { success: false, error: 'URL is required.' };

        try {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`Network error: ${response.statusText}`);
            const text = await response.text();
            const parsedData = d3.csvParse(text);

            if (!parsedData || parsedData.length === 0) {
                throw new Error('No data found in CSV.');
            }

            this.familyData = this._processData(parsedData);
            return { success: true };
        } catch (error) {
            console.error('Error loading data:', error);
            return { success: false, error: error.message };
        }
    }

    loadSampleData() {
        this.familyData = this._processData(SAMPLE_DATA);
        return { success: true };
    }

    _processData(rawData) {
        return rawData
            .filter(d => d.ID && d.Name && d.generation)
            .map(d => ({
                ...d,
                generation: +d.generation,
                hasSpouse: Boolean(d.SpouseID),
                hasParents: Boolean(d.Parent1ID) || Boolean(d.Parent2ID),
                FamilyTag: d.FamilyTag || ''
            }));
    }

    getData() {
        return this.familyData;
    }

    findPerson(id) {
        return this.familyData.find(p => p.ID === id);
    }

    getSpouse(person) {
        if (!person?.SpouseID) return null;
        // For multiple spouses, return the first one (for backward compatibility)
        const spouseIds = person.SpouseID.split(',').map(s => s.trim());
        return this.findPerson(spouseIds[0]);
    }
    
    getAllSpouses(person) {
        if (!person?.SpouseID) return [];
        const spouseIds = person.SpouseID.split(',').map(s => s.trim());
        return spouseIds.map(id => this.findPerson(id)).filter(Boolean);
    }

    getParents(person) {
        if (!person?.hasParents) return [];
        return [this.findPerson(person.Parent1ID), this.findPerson(person.Parent2ID)].filter(Boolean);
    }

    getChildren(personId) {
        return this.familyData.filter(p => p.Parent1ID === personId || p.Parent2ID === personId);
    }

    positionNodes(svgWidth) {
        const data = this.familyData;
        if (!Array.isArray(data) || data.length === 0) return [];

        const nodeWidth = CONFIG.node.width;
        const nodeHeight = CONFIG.node.height;
        const hSpacing = CONFIG.spacing.family;
        const vSpacing = CONFIG.spacing.generation;
        const coupleSpacing = CONFIG.spacing.couple;

        const idMap = new Map();
        data.forEach(d => idMap.set(d.ID, d));

        const positioned = new Set();
        const rightmostAtDepth = new Map();

        // Helper to position a person at specific coordinates
        const positionPerson = (person, x, depth) => {
            if (positioned.has(person.ID)) return;
            person.x = x;
            person.y = depth * vSpacing;
            positioned.add(person.ID);
            
            // Update rightmost tracker
            const rightEdge = x + nodeWidth;
            const currentRightmost = rightmostAtDepth.get(depth) || -Infinity;
            rightmostAtDepth.set(depth, Math.max(currentRightmost, rightEdge));
        };

        // Process each generation level
        const generationGroups = new Map();
        data.forEach(person => {
            const gen = person.generation - 1; // Convert to 0-based
            if (!generationGroups.has(gen)) {
                generationGroups.set(gen, []);
            }
            generationGroups.get(gen).push(person);
        });

        // Sort generations
        const sortedGenerations = Array.from(generationGroups.keys()).sort((a, b) => a - b);

        // Position from top generation down
        sortedGenerations.forEach(depth => {
            const people = generationGroups.get(depth);
            
            people.forEach(person => {
                if (positioned.has(person.ID)) return;

                // Get all spouses
                const spouses = this.getAllSpouses(person);
                
                // Check if any spouse is already positioned
                const positionedSpouse = spouses.find(s => positioned.has(s.ID));
                
                if (positionedSpouse) {
                    // Position next to already-positioned spouse
                    const baseX = positionedSpouse.x;
                    
                    // Find where to place this person relative to the spouse
                    // Check if we should be to the left or right
                    const spouseIds = positionedSpouse.SpouseID ? positionedSpouse.SpouseID.split(',').map(s => s.trim()) : [];
                    const indexInSpouse = spouseIds.indexOf(person.ID);
                    
                    if (indexInSpouse > 0) {
                        // This person is a later spouse, position to the right
                        let offset = nodeWidth + coupleSpacing;
                        for (let i = 1; i <= indexInSpouse; i++) {
                            const prevSpouseId = spouseIds[i - 1];
                            if (positioned.has(prevSpouseId)) {
                                const prevSpouse = idMap.get(prevSpouseId);
                                offset = Math.max(offset, (prevSpouse.x - baseX) + nodeWidth + coupleSpacing);
                            }
                        }
                        positionPerson(person, baseX + offset, depth);
                    } else {
                        // Position to the left
                        positionPerson(person, baseX - nodeWidth - coupleSpacing, depth);
                    }
                } else {
                    // No spouse positioned yet
                    const children = this.getChildren(person.ID);
                    
                    if (children.length > 0 && children.some(c => positioned.has(c.ID))) {
                        // Position based on children
                        const positionedChildren = children.filter(c => positioned.has(c.ID));
                        const childXPositions = positionedChildren.map(c => c.x);
                        const minChildX = Math.min(...childXPositions);
                        const maxChildX = Math.max(...childXPositions);
                        const centerX = (minChildX + maxChildX) / 2;
                        
                        // Account for multiple spouses when centering
                        const totalSpouses = spouses.filter(s => !positioned.has(s.ID)).length;
                        const totalWidth = nodeWidth + (totalSpouses * (nodeWidth + coupleSpacing));
                        const idealX = centerX - totalWidth / 2;
                        
                        // Ensure minimum spacing from others at this depth
                        const rightmost = rightmostAtDepth.get(depth) || -Infinity;
                        const minX = rightmost > -Infinity ? rightmost + hSpacing : idealX;
                        
                        positionPerson(person, Math.max(idealX, minX), depth);
                        
                        // Position unpositioned spouses
                        let spouseX = person.x + nodeWidth + coupleSpacing;
                        spouses.forEach(spouse => {
                            if (!positioned.has(spouse.ID)) {
                                positionPerson(spouse, spouseX, depth);
                                spouseX += nodeWidth + coupleSpacing;
                            }
                        });
                    } else {
                        // No children or children not positioned yet
                        const rightmost = rightmostAtDepth.get(depth) || 0;
                        const startX = rightmost > 0 ? rightmost + hSpacing : 0;
                        
                        positionPerson(person, startX, depth);
                        
                        // Position spouses to the right
                        let spouseX = startX + nodeWidth + coupleSpacing;
                        spouses.forEach(spouse => {
                            if (!positioned.has(spouse.ID)) {
                                positionPerson(spouse, spouseX, depth);
                                spouseX += nodeWidth + coupleSpacing;
                            }
                        });
                    }
                }
            });
        });

        // Center the entire tree
        const allX = data.map(d => d.x).filter(x => x !== undefined);
        if (allX.length > 0) {
            const minX = Math.min(...allX);
            const maxX = Math.max(...allX);
            const totalWidth = maxX - minX + nodeWidth;
            const offset = (svgWidth - totalWidth) / 2 - minX;

            data.forEach(d => {
                if (d.x !== undefined) d.x += offset;
            });
        }

        return data;
    }

    shiftBranch(node, shift) {
        if (node.x !== undefined) {
            node.x += shift;
        }

        const spouses = this.getAllSpouses(node);
        spouses.forEach(spouse => {
            if (spouse && spouse.x !== undefined) {
                spouse.x += shift;
            }
        });

        this.getChildren(node.ID).forEach(child => this.shiftBranch(child, shift));
    }
}