// tslint:disable-next-line:match-default-export-name
import * as axios from 'axios';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as yargs from 'yargs';
import { expect } from 'chai';
import { validateConfig } from '../src/helpers';
import { createServer } from '../src/index';

const httpClient = axios.default.create();

const goodConfig = yaml.safeLoad(
  fs.readFileSync(`${process.cwd()}/config.good.yml`, 'utf8')
);

describe('Parity Exporter Configurations', () => {
  it('does not throw when passed good configs', () => {
    const goodConfig = yaml.safeLoad(
      fs.readFileSync(`${process.cwd()}/config.good.yml`, 'utf8')
    );
    expect(() => {
      validateConfig(goodConfig);
    }).to.not.throw();
  });

  it('throws when passed bad config', () => {
    const badConfig = yaml.safeLoad(
      fs.readFileSync(`${process.cwd()}/test/config.bad.yml`, 'utf8')
    );
    expect(() => {
      validateConfig(badConfig);
    }).to.throw();
  });
});

describe('Parity Exporter with default config', () => {
  const defaultConfig = yaml.safeLoad(
    fs.readFileSync(`${process.cwd()}/config.yml`, 'utf8')
  );

  let parityResponse;
  const { rpcUrl, port } = defaultConfig;
  const url = `http://localhost:${port}`;
  let server;

  before(async () => {
    server = await createServer(rpcUrl, port);
    ({ data: parityResponse } = await httpClient.get(`${url}/metrics`));
  });

  after(() => {
    server.close();
  });

  it('has an index page', async () => {
    let indexResponse = await httpClient.get(url);

    expect(indexResponse.data).to.equal(
      '<p> You can find Metrics on the <a href="/metrics"> /Metrics</a> path </p>'
    );
  });

  it('get parity version', () => {
    expect(parityResponse).to.contain('parity_version{value="Parity-Ethereum');
  });

  it('get connected peers', () => {
    expect(parityResponse).to.match(/parity_connected_peers [0-9]+/);
  });

  it('get max peers', () => {
    expect(parityResponse).to.match(/parity_max_peers [0-9]+/);
  });

  it('get active peers', () => {
    expect(parityResponse).to.contain('parity_active_peers');
  });

  it('get sync status', () => {
    expect(parityResponse).to.contain('parity_sync_status');
  });

  it('parity status is up', () => {
    expect(parityResponse).to.contain('parity_up 1');
  });

  it('parity client is mining', () => {
    expect(parityResponse).to.contain('parity_mining 0');
  });

  it('get current block', () => {
    expect(parityResponse).to.match(/parity_current_block [0-9]+/);
  });
});

describe('Parity Exporter with Parity down', () => {
  let parityResponse;
  let server;
  const { rpcUrl, port } = goodConfig;
  const url = `http://localhost:${port}`;

  before(() => {
    server = createServer(rpcUrl, port);
  });

  after(() => {
    server.close();
  });

  it('parity status is down', async () => {
    let response = await httpClient.get(`${url}/metrics`);
    parityResponse = response.data;
    expect(parityResponse).to.contain('parity_up 0');
  });
});
