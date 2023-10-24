'use client'

import { ChartResolution, ChartType, LabelValue } from '@/app/_lib/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Chart, LineController, LinearScale, PointElement, LineElement, TimeScale, Point, Title} from 'chart.js'
import 'chartjs-adapter-date-fns';
import { enGB } from 'date-fns/locale';
import zoomPlugin from 'chartjs-plugin-zoom';
import { CHART_PARAM, END_PARAM, EVENTS_PARAM, RES_PARAM, START_PARAM } from '@/app/_lib/consts';
import { CHART } from '@/app/_lib/paths';
import { get } from '@/app/_lib/fetch';

Chart.register(
    LineController,
    LinearScale,
    TimeScale,  
    PointElement,
    LineElement,
    Title,
    zoomPlugin

);

type MetricChartProps = {
    type: ChartType
    resolution: ChartResolution
    metricEvents: string[]
    selectedTime: number
    color: string
}

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

function GetXRange(res: ChartResolution): number {
    switch (res) {
        case ChartResolution.Hour:
            return HOUR;
        case ChartResolution.Day:
            return DAY;
        case ChartResolution.Week:
            return DAY * 7;
        case ChartResolution.TwoWeeks:
            return DAY * 14;
        case ChartResolution.Month:
            return DAY * 30;
    }
}

function GetHalfXRange(res: ChartResolution) {
    return Math.ceil(GetXRange(res) / 2);
}

function GetUnit(res: ChartResolution) {
    switch (res) {
        case ChartResolution.Hour:
            return 'minute';
        case ChartResolution.Day:
            return 'hour';
        case ChartResolution.Week:
            return 'day';
        case ChartResolution.TwoWeeks:
            return 'day';
        case ChartResolution.Month:
            return 'day';
    }
}

export default function JsChart({type, resolution, metricEvents, selectedTime, color}: MetricChartProps) {
    const requestMetricsCb = useCallback(requestMetrics, [type, resolution, metricEvents]);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart| null>(null);
    const [viewDate, setViewDate] = useState<number>(selectedTime);
    const [viewport, setViewport] = useState<[number, number]>();
    const [loadingRange, setLoadingRange] = useState<[number, number]>();

    // initialize chart
    useEffect(()=> {
        if (chartRef.current || !canvasRef.current) {
            return;
        }
        const defaultResolution = ChartResolution.Week;
        const defaultTime = Date.now();
        const defaultColor = 'rgb(255, 255, 255)';

        const range = GetXRange(defaultResolution);

        chartRef.current = new Chart(canvasRef.current, {
            type: 'line',
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        max: defaultTime + range,
                        min: defaultTime - range,
                        time: {
                            unit: GetUnit(defaultResolution),
                            displayFormats: {
                                minute: 'HH:mm',
                                hour: 'HH:mm',
                                day: 'MMM d',
                                week: 'MMM d',
                                mouth: 'LLL uuuu'
                            }
                        },
                        adapters: {
                            date: {
                                locale: enGB
                            }
                        },
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 12,
                            major: {
                                enabled: true
                            }
                        }
                    },
                    y: {
                        type: 'linear',
                        min: 0
                    }
                },
                plugins: {
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                            onPanComplete: ({chart}) => {
                                const {min, max} = chart.scales.x;
                                setViewport([min, max]);
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'unknown',
                        align: 'start',
                        padding: {
                            top: 5,
                            bottom: 7
                        }
                    }
                }
            },
            data: {
                datasets: [{
                    borderColor: [defaultColor],
                    backgroundColor: [defaultColor],
                    label: 'unknown',
                    data: []
                }]
            },
            plugins: [zoomPlugin]
        });
    }, []);

    useEffect(()=> {
        const chart = chartRef.current;
        if (!resolution || metricEvents.length < 1 || !viewDate || !chart) {
            return;
        }

        const min = viewport? viewport[0] : viewDate - GetHalfXRange(resolution);
        const max = viewport? viewport[1] : viewDate + GetHalfXRange(resolution);
        const currentDate = Math.ceil(min+(max-min)/2);

        if (chart.options.scales && chart.options.scales.x) {
            // time is the plugin option and cause type assertion
            // @ts-ignore
            chart.options.scales.x.time.unit = GetUnit(resolution);    
        }
        if (chart.options.plugins && chart.options.plugins.title) {
            // title is the plugin option and cause type assertion
            // @ts-ignore
            chart.options.plugins.title.text = type;
        }
        chart.data.datasets[0].backgroundColor = [color];
        chart.data.datasets[0].borderColor = [color];
        chart.data.datasets[0].label = type;
        chart.data.datasets[0].data = [];
        
        const halfRange = GetHalfXRange(resolution);
        setViewport([currentDate - halfRange, currentDate + halfRange]); 
    }, [resolution, metricEvents, viewDate, type, color]);

    useEffect(() => {
        const chart = chartRef.current;
        if (!chart || !viewport) {
            return;
        }

        const viewStart = viewport[0];
        const viewEnd = viewport[1];
        const viewRange = viewEnd - viewStart;

        if (chart.options.scales && chart.options.scales.x) {
            chart.options.scales.x.min = Math.ceil(viewStart);
            chart.options.scales.x.max = Math.ceil(viewEnd);
            chart.update('none')
        }

        const desiredRangeStart = viewStart - viewRange * 2;
        const desiredRangeEnd = viewEnd + viewRange * 2;

        const loadedData = chart.data.datasets[0].data;
        const loadedPoints = loadedData.map((point: any) => point.x);
        const loadedRangeStart = Math.min(...loadedPoints);
        const loadedRangeEnd = Math.max(...loadedPoints);

        const loadedStartInDesiredRange = pointInRange(desiredRangeStart, desiredRangeEnd, loadedRangeStart);
        const loadedEndInDesiredRange = pointInRange(desiredRangeStart, desiredRangeEnd, loadedRangeEnd);

        let requiredRangeStart = desiredRangeStart;
        let requiredRangeEnd = desiredRangeEnd
        if (loadedStartInDesiredRange || loadedEndInDesiredRange) {     // handle intersection scenarios
            if (loadedStartInDesiredRange && loadedEndInDesiredRange) { // inclusion
                requiredRangeStart = desiredRangeStart;
                requiredRangeEnd = desiredRangeEnd
            } else if (loadedStartInDesiredRange) {     // right overlap
                requiredRangeEnd = loadedRangeStart;        // should load from desired start to begging of loaded data
            } else if (loadedEndInDesiredRange) {       // left overlap
                requiredRangeStart = loadedRangeEnd;        // load from loaded end to desired end
            } 
        }

        setLoadingRange([requiredRangeStart, requiredRangeEnd]);

        function pointInRange(start: number, end:number, point:number): boolean {
            return (point > start && point < end);
        }
    },[viewport]);

    useEffect (() => {
        const chart = chartRef.current;
        if (!loadingRange || !chart) {
            return;
        }

        const loadFrom = loadingRange[0];
        const loadTo = loadingRange [1];
        requestMetricsCb(loadFrom, loadTo).then((data) => {
            if (!data || data.length < 1) {
                return;
            }

            const loadedData = chart.data.datasets[0].data;

            const mergedValues = new Map(data.map(x => [new Date(x.label).getTime(), x.value]));
            loadedData.forEach(point => {
                const {x, y} = point as Point; 
                if (x && !mergedValues.has(x)) {
                    mergedValues.set(x, y);
                }
            });

            const updatedData: any[] = [];
            mergedValues.forEach((value, key)=> {
                updatedData.push({
                    x: new Date(key).getTime(),
                    y: value
                });
            });

            chart.data.datasets[0].data = updatedData.sort((a,b)=> a.x-b.x); // sort for correct visualization
            chart.update('none');
        });


    }, [loadingRange, requestMetricsCb]);

    async function requestMetrics(start:number, end: number): Promise<LabelValue[] | null> {
        const response = await get(CHART)
            .withParams(
                [CHART_PARAM, type],
                [EVENTS_PARAM, metricEvents.join(';')],
                [RES_PARAM, resolution],
                [START_PARAM, start.toString()],
                [END_PARAM, end.toString()]
            ).send();
        if (response.ok) {
            const data = await response.json() as unknown as LabelValue[];
            return data;
        }
        return null;
    }

    return (
        <div className='w-full h-full'>
            <canvas ref={canvasRef}></canvas>
        </div>
    );
}