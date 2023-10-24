// 'use-client'

// import { useCallback, useEffect, useId, useRef, useState } from 'react';
// import { CHART } from '@/app/_lib/paths';
// import { CHART_PARAM, END_PARAM, EVENTS_PARAM, RES_PARAM, START_PARAM } from '@/app/_lib/consts';
// import { ChartResolution, ChartType, LabelValue } from '@/app/_lib/types';
// import { get } from '@/app/_lib/fetch';
// import Chart from 'react-apexcharts'
// import { ApexOptions } from 'apexcharts';

// type MetricChartProps = {
//     type: ChartType
//     resolution: ChartResolution
//     metricEvents: string[]
//     selectedTime: number
// }

// type ApexPoint = {
//     x:any
//     y:any
// }

// const HOUR = 1000 * 60 * 60;
// const DAY = HOUR * 24;

// function GetXRange(res: ChartResolution): number {
//     switch (res) {
//         case ChartResolution.Hour:
//             return HOUR;
//         case ChartResolution.Day:
//             return DAY;
//         case ChartResolution.Week:
//             return DAY * 7;
//         case ChartResolution.TwoWeeks:
//             return DAY * 14;
//         case ChartResolution.Month:
//             return DAY * 30;
//     }
// }

// function GetChartStep(res: ChartResolution): number {
//     switch (res) {
//         case ChartResolution.Hour:
//             return 1000 * 60 * 10;
//         case ChartResolution.Day:
//             return HOUR * 3;
//         case ChartResolution.Week:
//             return DAY;
//         case ChartResolution.TwoWeeks:
//             return DAY * 2;
//         case ChartResolution.Month:
//             return DAY * 4;
//     }
// }

// export default function MetricChart({resolution, type, metricEvents, selectedTime}:MetricChartProps) {
//     const chartId = useId();
//     const [loadedRange, setLoadedRange] = useState<[number, number]>();
//     const [viewRange, setViewRange] = useState<[number, number]>();
//     const [series, setSeries] = useState<ApexAxisChartSeries>([{name: type, data: []}]);
//     const [chartOptions, setChartOptions] = useState(createOptions());

//     useEffect(()=> {
//         if (typeof window === 'undefined') {
//             return;
//         }
//         if (!resolution || metricEvents.length < 1 || !selectedTime) {
//             return;
//         }

//         const dataOverflow = GetXRange(resolution) * 1.15;
//         const from = selectedTime - dataOverflow;
//         const to = selectedTime + dataOverflow;
//         requestMetrics(from, to).then( (responseData)=> {
//             if (!responseData || responseData.length === 0) {
//                 return;
//             }

//             const newSeries = [{
//                 name: type, 
//                 data: responseData.map(x=> {return {x: new Date(x.label), y: x.value}})
//             }];

//             setChartOptions(createOptions());
//             setSeries(newSeries);
//         }).catch((error) => console.log(error));
//     }, [resolution, metricEvents, selectedTime]);

//     useEffect (()=> {
//         if ( typeof window === 'undefined') {
//             return;
//         }

//         if (!loadedRange) {
//             return;
//         }

//         requestMetrics(loadedRange[0], loadedRange[1]).then((responseData) => {
//             if (!responseData || responseData.length === 0) {
//                 return;
//             }

//             const mergedValues = new Map(responseData.map(x => [x.label, x.value]));
//             if (series[0] && series[0].data) {
//                 series[0].data.forEach(point => {
//                     const {x, y} = point as ApexPoint; 
//                     if (x && !mergedValues.has(x)) {
//                         mergedValues.set(x, y);
//                     }
//                 });
//             }

//             const seriesData: ApexPoint[] = [];
//             mergedValues.forEach((value, key)=> {
//                 seriesData.push({
//                     x: new Date(key),
//                     y: value
//                 });
//             });

//             const updatedSeries = [{
//                 name: type as string,
//                 data: seriesData
//             }];

//             ApexCharts.exec(chartId, 'appendData', updatedSeries);
//         });
//     }, [loadedRange])

//     useEffect(() => {
//         if (!viewRange)  {return;}

//         const [min, max] = viewRange;
//         const loaded = series[0].data.map(point => point.x.getTime());
//         const minLoaded = Math.min(...loaded);
//         const maxLoaded = Math.max(...loaded);

//         let loadFrom;
//         let loadTo;
//         if (Math.abs(minLoaded-min) <= GetChartStep(resolution)) {
//             loadFrom = minLoaded - GetXRange(resolution);
//             loadTo = minLoaded;
            
//         } else if (Math.abs(maxLoaded-max) <= GetChartStep(resolution)) {
//             loadFrom = maxLoaded;
//             loadTo = maxLoaded + GetXRange(resolution);
//         } 
//         if(loadFrom && loadTo) {
//             setLoadedRange([loadFrom, loadTo]);
//         }
//     }, [viewRange])

//     function createOptions() {
//         const options = 
//         {
//             chart: {
//                 id: chartId,
//                 toolbar: {
//                     show: true,
//                     tools: {
//                         pan: true,
//                         download: false,
//                         reset: false,
//                         zoom: false,
//                         zoomin: false,
//                         zoomout: false
//                     }
//                 }, 
//                 events: {
//                     scrolled: (chart:any, options: any) => { setViewRange([options.xaxis.min, options.xaxis.max]); }
//                 }
//             },
//             dataLabels: {
//                 enabled: false
//             },
//             series: [],
//             title: {
//                 text: type,
//             },
//             noData: {
//                 text: 'Loading...'
//             },
//             xaxis: {
//                 type: 'datetime',
//                 range: GetXRange(resolution)
//             },
//         } as ApexOptions;
//         return options;
//     }

//     async function requestMetrics(start:number, end: number): Promise<LabelValue[] | null> {
//         const response = await get(CHART)
//             .withParams(
//                 [CHART_PARAM, type],
//                 [EVENTS_PARAM, metricEvents.join(';')],
//                 [RES_PARAM, resolution],
//                 [START_PARAM, start.toString()],
//                 [END_PARAM, end.toString()]
//             ).send();
//         if (response.ok) {
//             const data = await response.json() as unknown as LabelValue[];
//             return data;
//         }
//         return null;
//     }

//     return(
//         <>
//         <div className='w-full h-full'>
//             <Chart id={chartId} options={chartOptions} series={series} type='line' height={'100%'}></Chart>
//         </div>
//         </>
//     );

// }