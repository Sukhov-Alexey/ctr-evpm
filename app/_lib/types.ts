export enum TableType {
    Site = 'site_id',
    DMA = 'mm_dma'
}

export enum ChartType {
    CTR = 'CTR',
    EvPM = 'EvPM'
}

export enum ChartResolution{
    Hour = 'Hour',
    Day = 'Day',
    Week = 'Week',
    TwoWeeks = '2 Weeks',
    Month = 'Month'
}

export type LabelValue = {
    label: string,
    value: number | null
}

export type ImpEventData = {
    sp: string, // Start Interval Point: Date as string
    ep: string, // End Interval Point: Date as string
    total: number, 
    ev_count: number,
    metric: number
}

export type TableData = {
    target: string
    ctr: number
    evpm: number
    total: number
};

export type TableResponse = {
    totalPages: number
    data: TableData[]
}

export type TableColumn = {
    key: string
    name: string
}

export type MetricsRequestParams = {
    type: ChartType,
    resolution: ChartResolution,
    events: string[],
    start: Date,
    end: Date
}

export type TableRequestParams = {
    type: TableType,
    events: string[]
    filter?: string, 
    page: number, 
    pageSize: number
}

export type ChResponse = {
    data: [],
    rows_before_limit_at_least?: number
}


export function IsValidChartType(value: string | null | undefined) {
    if (!value) {
        return false;
    }
    return Object.values(ChartType).includes(value as ChartType);
}

export function IsValidChartResolution(value: string | null | undefined) {
    if (!value) {
        return false;
    }
    return Object.values(ChartResolution).includes(value as ChartResolution);
}

export function IsValidTableType(value: string | null | undefined) {
    if (!value) {
        return false;
    }

    return Object.values(TableType)
}
