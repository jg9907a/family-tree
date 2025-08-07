// js/DataManager.js

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
        return person?.hasSpouse ? this.findPerson(person.SpouseID) : null;
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

        const childrenMap = new Map();
        data.forEach(person => {
            if (person.Parent1ID) {
                if (!childrenMap.has(person.Parent1ID)) childrenMap.set(person.Parent1ID, []);
                childrenMap.get(person.Parent1ID).push(person.ID);
            }
            if (person.Parent2ID) {
                if (!childrenMap.has(person.Parent2ID)) childrenMap.set(person.Parent2ID, []);
                childrenMap.get(person.Parent2ID).push(person.ID);
            }
        });

        const positioned = new Set();
        let cursorX = 0;

        const assign = (id, depth = 0) => {
            if (positioned.has(id)) return;

            const person = idMap.get(id);
            const spouse = person.hasSpouse ? idMap.get(person.SpouseID) : null;

            const children = this.getChildren(id).filter(c => !positioned.has(c.ID));
            let childWidths = [];

            if (children.length > 0) {
                children.forEach(child => {
                    assign(child.ID, depth + 1);
                    childWidths.push(child.x);
                });

                const minX = Math.min(...childWidths);
                const maxX = Math.max(...childWidths);
                const center = (minX + maxX) / 2;

                person.x = center - (spouse ? (nodeWidth + coupleSpacing) / 2 : nodeWidth / 2);
                if (spouse) spouse.x = person.x + nodeWidth + coupleSpacing;
            } else {
                person.x = cursorX;
                if (spouse) {
                    spouse.x = cursorX + nodeWidth + coupleSpacing;
                    cursorX += nodeWidth * 2 + coupleSpacing + hSpacing;
                } else {
                    cursorX += nodeWidth + hSpacing;
                }
            }

            person.y = depth * vSpacing;
            if (spouse) spouse.y = person.y;

            positioned.add(person.ID);
            if (spouse) positioned.add(spouse.ID);
        };

        // Start from all people with no parents
        const roots = data.filter(p => !p.Parent1ID && !p.Parent2ID);
        roots.forEach(p => assign(p.ID, 0));

        // Final centering (optional)
        const allX = data.map(d => d.x).filter(x => x !== undefined);
        const minX = d3.min(allX);
        const maxX = d3.max(allX);
        const totalWidth = maxX - minX + nodeWidth;
        const offset = (svgWidth - totalWidth) / 2 - minX;

        data.forEach(d => {
            if (d.x !== undefined) d.x += offset;
            d.y = d.generation * vSpacing;
        });

        return data;
    }


    shiftBranch(node, shift) {
        if (node.x !== undefined) {
            node.x += shift;
        }

        const spouse = this.getSpouse(node);
        if (spouse && spouse.x !== undefined) {
            spouse.x += shift;
        }

        this.getChildren(node.ID).forEach(child => this.shiftBranch(child, shift));
    }
}
