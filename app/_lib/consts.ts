export const CHART_PARAM = 'ct'; // chart type request param
export const RES_PARAM = 'res'; // resolution request param
export const EVENTS_PARAM = 'events'; // events request param
export const START_PARAM = 'start';
export const END_PARAM = 'end';

export const TABLE_PARAM = 'tt';
export const FILTER_PARAM = 'filter';
export const PAGE_PARAM = 'page';
export const PAGE_SIZE_PARAM = 'page_s';

const COMMON_COLUMNS = [
    { 
        key: 'ctr', 
        name: 'CTR',     
        resizable: true,
    },
    { 
        key: 'evpm', 
        name: 'EvPM',
        resizable: true,
    },
    { 
        key: 'total', 
        name: 'Impressions',
        resizable: true,
    }
]

export const SITE_COLUMNS = [
    { 
        key: 'target', 
        name: 'Site', 
        resizable: true
    },
    ...COMMON_COLUMNS
]

export const DMA_COLUMNS = [
    { 
        key: 'target', 
        name: 'DMA',
        resizable: true
    },
    ...COMMON_COLUMNS
]