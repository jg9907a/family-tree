// js/config.js

export const CONFIG = {
    // SVG dimensions
    svg: {
        width: 1340,
        height: 600
    },
    
    // Node dimensions
    node: {
        width: 150,
        height: 70,
        borderRadius: 12,
        strokeWidth: 3,
        selectedStrokeWidth: 5
    },
    
    // Spacing
    spacing: {
        generation: 200,
        couple: 30,
        family: 80,
        margin: 50
    },
    
    // Colors
    colors: {
        singleGradient: {
            start: '#56CCF2',
            end: '#2F80ED'
        },
        marriedGradient: {
            start: '#F093FB',
            end: '#F5576C'
        },
        marriageLine: '#FF6B6B',
        parentChildLine: '#4ECDC4',
        selectedStroke: '#FFD700',
        defaultStroke: 'white'
    },
    
    // Animation
    animation: {
        duration: {
            short: 200,
            medium: 300,
            long: 500,
            extraLong: 750
        }
    },
    
    // Zoom
    zoom: {
        min: 0.1,
        max: 3,
        inFactor: 1.2,
        outFactor: 0.8,
        panSpeed: 50
    },
    
    // Text
    text: {
        nameFontSize: 15,
        yearFontSize: 13,
        nameOffset: -8,
        yearOffset: 10
    }
};

// Sample data for testing
export const SAMPLE_DATA = [
    { ID: '1', Name: 'John Smith', generation: '1', SpouseID: '2', Parent1ID: '', Parent2ID: '', BirthYear: '1950' },
    { ID: '2', Name: 'Mary Johnson', generation: '1', SpouseID: '1', Parent1ID: '', Parent2ID: '', BirthYear: '1952' },
    { ID: '3', Name: 'Robert Smith', generation: '2', SpouseID: '4', Parent1ID: '1', Parent2ID: '2', BirthYear: '1975' },
    { ID: '4', Name: 'Lisa Brown', generation: '2', SpouseID: '3', Parent1ID: '', Parent2ID: '', BirthYear: '1977' },
    { ID: '5', Name: 'Jennifer Smith', generation: '2', SpouseID: '', Parent1ID: '1', Parent2ID: '2', BirthYear: '1978' },
    { ID: '6', Name: 'Michael Smith', generation: '3', SpouseID: '', Parent1ID: '3', Parent2ID: '4', BirthYear: '2001' },
    { ID: '7', Name: 'Sarah Smith', generation: '3', SpouseID: '', Parent1ID: '3', Parent2ID: '4', BirthYear: '2003' },
    { ID: '8', Name: 'David Wilson', generation: '1', SpouseID: '9', Parent1ID: '', Parent2ID: '', BirthYear: '1948' },
    { ID: '9', Name: 'Carol Davis', generation: '1', SpouseID: '8', Parent1ID: '', Parent2ID: '', BirthYear: '1950' },
    { ID: '10', Name: 'Tom Wilson', generation: '2', SpouseID: '', Parent1ID: '8', Parent2ID: '9', BirthYear: '1972' }
];