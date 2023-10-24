'use-client'

import { ChangeEvent, useCallback, useEffect, useId, useState } from 'react';

type EventSelectorProps = {
    eventsList: string[];
    onSelectedChanged: (events: string[]) => void
}

export default function EventSelector({eventsList, onSelectedChanged}: EventSelectorProps) {
    const id = useId();
    const selectChangeCallback =  useCallback(handleSelectChange, [eventsList, onSelectedChanged]);
    const [displayedEvents, setDisplayedEvents] = useState<string[]>([]);
    const [defaultSelected, setDefaultSelected] = useState<string>();

    useEffect(()=> {
        const clickThroughOnly = eventsList.map(x=> x.startsWith('v')? x.substring(1) : x);
        const updatedEvents = [...(new Set<string>(clickThroughOnly))];
        setDisplayedEvents(updatedEvents);
        if (!defaultSelected || !updatedEvents.includes(defaultSelected)) {
            setDefaultSelected(updatedEvents[0]);
            selectChangeCallback(updatedEvents[0]);
        }
    }, [eventsList, defaultSelected, selectChangeCallback]);

    function handleSelectChange(event: string) {
        if (!event) {
            return;
        }

        const vEvent = `v${event}`;

        if (eventsList.includes(vEvent)) {
            onSelectedChanged([event, vEvent])
        } else {
            onSelectedChanged([event]);
        } 
    };

    if (displayedEvents?.length > 1) {
        return (
            <select className='bg-transparent focus:border-b-black outline-none border-b-2' 
                defaultValue={defaultSelected} 
                onChange={(e) => selectChangeCallback(e.target.value)}>
            {
                displayedEvents.map(event => 
                    <option key={`${id}_${event}`}>{event}</option>
                )
            }
            </select>
        );
    } else {
        return null;
    }
}