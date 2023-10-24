'use client'

import { useState } from 'react';
import {ChartResolution, ChartType, LabelValue} from '@/app/_lib/types';
import RadioButtonGroup from '../radio-button-group';
import EventSelector from '../event-selector';
import JsChart from './jschart';

const RESOLUTIONS = Object.values(ChartResolution);

export type ChartPlateProps = {
    type: ChartType
    eventsList: string[]
    lastImpTime: number
}

export default function ChartPlate({type, eventsList, lastImpTime}: ChartPlateProps) {
const [resolution, setResolution] = useState<ChartResolution>(ChartResolution.Week);
    const [metricEvents, setMetricEvents] = useState<string[]>([]);

    const handleResolutionChange = (val: string) => {
        setResolution(val as ChartResolution);
    }

    const handleMetricEventsChange = (events: string[]) => {
        setMetricEvents(events);
    }

    const time = Math.ceil(lastImpTime - (1000 * 60 * 60 * 24 * 7)/2);
    const color = type === ChartType.CTR? 'rgb(251, 188, 168)' : 'rgb(156, 206, 246)';

    return (
        <div className='relative h-30vh flex flex-col w-full'>
            <div className=' absolute flex flex-row left-1/2 transform -translate-x-1/2 z-50'>
                <EventSelector eventsList={eventsList} onSelectedChanged={handleMetricEventsChange}/>
            </div>
            
            <div className='h-full w-full place-self-center'>
                <JsChart selectedTime={time} type={type} resolution={resolution} metricEvents={metricEvents} color={color}></JsChart>
            </div>
            <div className='place-self-center'>
                <RadioButtonGroup groupName={type} values={RESOLUTIONS} defValue={resolution} onChange={handleResolutionChange}></RadioButtonGroup>
            </div>
        </div>
    );
}