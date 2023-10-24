import * as fs from 'fs';
import 'dotenv/config';
import { config } from 'dotenv';
import { createClient } from '@clickhouse/client';
import csv from 'csv-parser';

const EVENTS_DATA_FILE = 'data/interview.y.csv';
const IMP_DATA_FILE = 'data/interview.x.csv';

config();
console.log('Start database initialization');
initDatabase().then(() => {
  console.log('Database initialized');
  process.exit();
}).catch(error => {
  console.error('Error while database initialization', error);
  process.exit(1);
});



async function initDatabase() {
  const host = process.env.DB_HOST;
  const username = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const useSsl = process.env.DB_USE_SSL;

  const clientOptions = {
    host,
    username,
    password,
    database
  };
  if (useSsl) {
    clientOptions.tls = {
      ca_cert: fs.readFileSync('RootCA.pem')
    }
  }

  const client = createClient(clientOptions);

  console.log('Start creating tables');
  await createTables(client);
  console.log('Tables creating finished');
  console.log('--------------');

  console.log('Start creating views');
  await createViews(client);
  console.log('Views created');
  console.log('--------------');

  console.log('Starting upload data');
  await uploadData(client);
  console.log('Data upload finished');
  console.log('--------------');

}

async function createTables(client) {
  const createEventsTableRequest = `
  CREATE TABLE IF NOT EXISTS events
  (
    uid UUID,
    tag String
  )
  ENGINE = MergeTree
  ORDER BY uid
  `;

  const createImpressionsTableRequest = `
  CREATE TABLE IF NOT EXISTS impressions
  (
    reg_time DateTime,
    uid UUID,
    fc_imp_chk Int8,
    fc_time_chk Int8,
    utmtr Int8,
    mm_dma UInt16,
    osName String,
    model String,
    hardware String,
    site_id String
  )
  ENGINE = MergeTree
  ORDER BY reg_time
  `;

  const createSiteMetricsTableRequest = `
  CREATE TABLE IF NOT EXISTS site_metrics
  (
    site_id String,
    registration UInt64,
    content UInt64,
    signup UInt64,
    lead UInt64,
    misc UInt64,
    fclick UInt64,
    total UInt64
  )
  ENGINE = SummingMergeTree
  ORDER BY site_id
  `
  const createDmaMetricsTableRequest = ` 
  CREATE TABLE IF NOT EXISTS dma_metrics
  (
    mm_dma UInt16,
    registration UInt64,
    content UInt64,
    signup UInt64,
    lead UInt64,
    misc UInt64,
    fclick UInt64,
    total UInt64
  )
  ENGINE = SummingMergeTree
  ORDER BY mm_dma
  `;

  console.log(' Creating events table');
  await client.query({ query: createEventsTableRequest });
  console.log(' Events table creating finished');

  console.log(' Creating impressions table');
  await client.query({ query: createImpressionsTableRequest });
  console.log(' Impressions table creating finished');

  console.log(' Creating site metrics table');
  await client.query({ query: createSiteMetricsTableRequest });
  console.log(' Site metrics creating finished');

  console.log(' Creating DMA metrics table');
  await client.query({ query: createDmaMetricsTableRequest });
  console.log(' DMA metrics table creating finished');
}

async function createViews(client) {
  const createSiteMetricsView = `
  CREATE MATERIALIZED VIEW IF NOT EXISTS site_metrics_mv TO site_metrics
  (
      site_id String,
      registration UInt64,
      content UInt64,
      signup UInt64,
      lead UInt64,
      misc UInt64,
      fclick UInt64,
      total UInt64
  ) AS
  SELECT
      site_id,
      countIf((tag = 'registration') OR (tag = 'vregistration')) AS registration,
      countIf((tag = 'content') OR (tag = 'vcontent')) AS content,
      countIf((tag = 'signup') OR (tag = 'vsignup')) AS signup,
      countIf((tag = 'lead') OR (tag = 'vlead')) AS lead,
      countIf((tag = 'misc') OR (tag = 'vmisc')) AS misc,
      countIf(tag = 'fclick') AS fclick,
      count(*) AS total
  FROM impressions
  LEFT JOIN events ON impressions.uid = events.uid
  GROUP BY site_id;
  `;

  const createDMAMetricsMV = `
  CREATE MATERIALIZED VIEW IF NOT EXISTS dma_metrics_mv TO dma_metrics
  (
    mm_dma UInt16,
    registration UInt64,
    content UInt64,
    signup UInt64,
    lead UInt64,
    misc UInt64,
    fclick UInt64,
    total UInt64
  ) AS
  SELECT
      mm_dma AS mm_dma,
      countIf((events.tag = 'registration') OR (events.tag = 'vregistration')) AS registration,
      countIf((events.tag = 'content') OR (events.tag = 'vcontent')) AS content,
      countIf((events.tag = 'signup') OR (events.tag = 'vsignup')) AS signup,
      countIf((events.tag = 'lead') OR (events.tag = 'vlead')) AS lead,
      countIf((events.tag = 'misc') OR (events.tag = 'vmisc')) AS misc,
      countIf(events.tag = 'fclick') AS fclick,
      count(*) AS total
  FROM impressions
  LEFT JOIN events ON impressions.uid = events.uid
  GROUP BY mm_dma;
  `;

  console.log(' Creating site metrics view');
  await client.query({ query: createSiteMetricsView });
  console.log(' Site metrics view creating finished');
  console.log(' Creating DMA metrics view');
  await client.query({ query: createDMAMetricsMV });
  console.log(' DMA metrics view creating finished');
}

async function uploadData(client) {
  const impressionsExists = fs.existsSync(EVENTS_DATA_FILE);
  const eventsExists = fs.existsSync(IMP_DATA_FILE);

  if (!impressionsExists || !eventsExists) {
    console.warn('  One or both data files is not found. Data uploading has been skipped');
    return;
  }

  console.log('  Uploading Events');
  await insertData('events', EVENTS_DATA_FILE);
  console.log('  Events uploaded');

  console.log('  Uploading Impressions')
  await insertData('impressions', IMP_DATA_FILE);
  console.log('  Impressions uploaded')

  async function insertData(table, file) {
    await client.insert({
      table,
      format: 'CSV',
      values: fs.createReadStream(file)
    });
  }

}
