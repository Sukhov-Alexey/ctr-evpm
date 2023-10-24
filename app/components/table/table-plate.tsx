'use client'

import { EVENTS_PARAM, FILTER_PARAM, PAGE_PARAM, PAGE_SIZE_PARAM, TABLE_PARAM } from '@/app/_lib/consts';
import { get } from '@/app/_lib/fetch';
import { TABLE } from '@/app/_lib/paths';
import { TableColumn, TableData, TableResponse, TableType } from '@/app/_lib/types';
import { useEffect, useState } from 'react';
import DataGrid from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import './grid.css';
import EventSelector from '../event-selector';

type TablePlateProps = {
    type: TableType
    page: number
    columns: TableColumn[]
    allEvents: string[]
};

export default function TablePlate({type, page, columns, allEvents}: TablePlateProps) {
    const [totalPages, setTotalPages] = useState<number| null>(null);
    const [currentPage, setCurrentPage] = useState(page);
    const [rows, setRows] = useState<TableData[]>([]);
    const [events, setEvents] = useState<string[]>([]);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const response = await get(TABLE)
                .withParams(
                    [TABLE_PARAM, type],
                    [FILTER_PARAM, filter],
                    [PAGE_PARAM, (currentPage  - 1).toString()],
                    [PAGE_SIZE_PARAM, '20'],
                    [EVENTS_PARAM, events.join(';')]
                )
            .send();
            if (response.ok) {
                const tableResponse = await response.json() as unknown as TableResponse;
                setTotalPages(tableResponse.totalPages);
                setRows(tableResponse.data);
            }
        }

        if (currentPage && events.length > 0) {
            fetchData();
        }
        
    }, [currentPage, events, filter, type]);

    const handleCurrentPageChanged = (newPage: number) => {
        if (totalPages && newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    }

    return (
    <div className='relative flex flex-col h-auto w-auto'>
        <div className='flex flex-row min-w-1/2 place-self-center py-1 gap-x-6'>
            <input className='bg-transparent w-full px-2 border-b-2 focus:outline-none focus:border-black' 
                placeholder='filter rows'  
                onChange={(e)=>setFilter(e.target.value)} 
                type='text'/>
            <EventSelector eventsList={allEvents} onSelectedChanged={setEvents}></EventSelector>
        </div>
        
        <DataGrid className='h-full' rows={rows} columns={columns}/>

        <div className='flex flex-row w-fit gap-x-4 place-self-center items-center justify-center pt-2 h-14'>
            <PageButton text='<' onClick={()=>handleCurrentPageChanged(currentPage - 1)}></PageButton>            
            <div className='flex flex-col content-center'>
                <input className=' h-full bg-transparent border-b-2 focus:outline-none text-center' 
                    type='number'
                    min='1' 
                    max={totalPages || 0} 
                    value={currentPage} 
                    onChange={(e)=>handleCurrentPageChanged(e.target.valueAsNumber)}></input>    
                <span className='text-xs text-center text-gray-500'>total: {totalPages}</span>
            </div>
            <PageButton text='>'onClick={()=>handleCurrentPageChanged(currentPage + 1)}></PageButton>
        </div>
    </div>);
}

function PageButton({text, onClick}:{text:string, onClick: ()=>void}) {
    return (
    <button className='flex flex-wrap h-full aspect-square rounded-full justify-center content-center bg-control shadow-lg hover:drop-shadow-lg text-blue-400 text-3xl font-bold' onClick={()=>onClick()}>
        <p className='leading-zero'>{text}</p>
    </button>
    );
}