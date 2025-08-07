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
        marriageLine: '#FF6B6B',        // Solid red for current marriage
        divorcedLine: '#FFB6B6',        // Pink for divorced (will be dashed)
        widowedLine: '#999999',         // Gray for widowed
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

// CORRECT SAMPLE DATA - One person, multiple spouses
export const SAMPLE_DATA = [
    // John Smith - has TWO spouses (divorced from Mary, married to Susan)
    { 
        ID: '1', 
        Name: 'John Smith', 
        generation: '1', 
        SpouseID: '2,3',  // MULTIPLE SPOUSES: Mary and Susan
        SpouseStatus: 'divorced,married',  // Status for each spouse
        Parent1ID: '', 
        Parent2ID: '', 
        BirthYear: '1950'
    },
    // Mary - divorced from John
    { 
        ID: '2', 
        Name: 'Mary Johnson', 
        generation: '1', 
        SpouseID: '1',  
        SpouseStatus: 'divorced',
        Parent1ID: '', 
        Parent2ID: '', 
        BirthYear: '1952'
    },
    // Susan - married to John
    { 
        ID: '3', 
        Name: 'Susan Williams', 
        generation: '1', 
        SpouseID: '1',
        SpouseStatus: 'married',
        Parent1ID: '', 
        Parent2ID: '', 
        BirthYear: '1955'
    },
    
    // Children from first marriage (John & Mary)
    { 
        ID: '4', 
        Name: 'Robert Smith', 
        generation: '2', 
        SpouseID: '5',
        SpouseStatus: 'married',
        Parent1ID: '1', 
        Parent2ID: '2', 
        BirthYear: '1975'
    },
    { 
        ID: '5', 
        Name: 'Lisa Brown', 
        generation: '2', 
        SpouseID: '4',
        SpouseStatus: 'married',
        Parent1ID: '', 
        Parent2ID: '', 
        BirthYear: '1977'
    },
    
    // Children from second marriage (John & Susan)
    { 
        ID: '6', 
        Name: 'Emma Smith', 
        generation: '2', 
        SpouseID: '',
        SpouseStatus: '',
        Parent1ID: '1', 
        Parent2ID: '3', 
        BirthYear: '1990'
    },
    
    // Widowed example
    { 
        ID: '7', 
        Name: 'David Wilson', 
        generation: '1', 
        SpouseID: '8',
        SpouseStatus: 'widowed',
        Parent1ID: '', 
        Parent2ID: '', 
        BirthYear: '1948'
    },
    { 
        ID: '8', 
        Name: 'Carol Davis', 
        generation: '1', 
        SpouseID: '7',
        SpouseStatus: 'deceased',
        Parent1ID: '', 
        Parent2ID: '', 
        BirthYear: '1950',
        DeathYear: '1990'
    }
];