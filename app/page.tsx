import ChartPlate from '@/app/components/chart/chart-plate'
import { GetLastDate, GetListOfEvents } from '@/app/_lib/data'
import { ChartType, TableType } from './_lib/types';
import TablePlate from './components/table/table-plate';
import { DMA_COLUMNS, SITE_COLUMNS } from './_lib/consts';
import ContentPanel from './components/content-panel';

export default async function Home() {
  const eventsList = await GetListOfEvents();
  const lastDate = await GetLastDate();

  return (
    <div className='grid lg:grid-cols-2 grid-cols-1 gap-x-6 gap-y-6 p-2 lg:px-24 lg:pt-10 p2'>
      <ContentPanel>
        <ChartPlate lastImpTime={lastDate} type={ChartType.CTR} eventsList={['fclick']} />
      </ContentPanel>
      <ContentPanel> 
        <ChartPlate lastImpTime={lastDate} type={ChartType.EvPM} eventsList={eventsList} />
      </ContentPanel>
      <ContentPanel>
        <TablePlate allEvents={eventsList} columns={SITE_COLUMNS} type={TableType.Site} page={1} />
      </ContentPanel>
      <ContentPanel>
        <TablePlate allEvents={eventsList} columns={DMA_COLUMNS} type={TableType.DMA} page={1} />
      </ContentPanel>
    </div>
  );
}
