import { Injectable } from '@nestjs/common';
import { ChartConfiguration } from 'chart.js';
import 'chartjs-adapter-moment';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { SingleLineChartData } from '../interfaces/data/single-line-chart-data.interface';

@Injectable()
export class ChartRendererService {
  async renderServersAndPlayersChart(
    title: string,
    players: SingleLineChartData,
    servers: SingleLineChartData,
    width = 800,
    height = 300,
  ): Promise<Buffer> {
    const mapLineChartData = (
      data: SingleLineChartData,
    ): { x: Date; y: number }[] =>
      data.map(([x, y]) => ({ x: new Date(x), y }));

    const maxPlayers = players.reduce((prev, [, y]) => Math.max(prev, y), 0);
    const maxServers = servers.reduce((prev, [, y]) => Math.max(prev, y), 0);
    const maxValue = Math.max(maxPlayers, maxServers);

    const canvasRenderService = ChartRendererService.getCanvasRenderService(
      width,
      height,
    );

    const configuration: ChartConfiguration = {
      type: 'line',
      data: {
        datasets: [
          {
            data: mapLineChartData(servers) as unknown as {
              x: number;
              y: number;
            }[],
            label: ' ' + servers[0][1].toLocaleString('en-US') + ' Servers',
            borderColor: 'rgb(23, 150, 243)',
            backgroundColor: 'rgba(23, 150, 243, 0.6)',
            borderWidth: 2,
            fill: 'origin',
            pointRadius: 0,
            order: 0,
          },
          {
            data: mapLineChartData(players) as unknown as {
              x: number;
              y: number;
            }[],
            label: ' ' + players[0][1].toLocaleString('en-US') + ' Players',
            borderColor: 'rgba(255,12,0,0.25)',
            backgroundColor: 'rgba(247, 114, 104, 1)',
            borderWidth: 2,
            fill: 'origin',
            pointRadius: 0,
            order: 1,
          },
        ],
      },
      options: {
        scales: {
          x: {
            type: 'timeseries',
            time: {
              unit: 'day',
            },
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              autoSkip: true,
              maxTicksLimit: 6,
              callback: function (label: number) {
                if (maxValue > 5000) {
                  return label / 1000 + 'k';
                } else {
                  return label;
                }
              },
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: title,
            font: {
              size: 20,
              style: 'normal',
            },
            color: '#444',
          },
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: '',
              boxWidth: 8,
              font: {
                size: 12,
              },
              color: '#000',
              padding: 15,
            },
          },
        },
      },
    };

    // For some reason, it is not possible to render SVG async
    return canvasRenderService.renderToBufferSync(
      configuration,
      'image/svg+xml',
    );
  }

  private static canvasRenderServices: {
    [resolution: string]: ChartJSNodeCanvas;
  } = {};

  private static getCanvasRenderService(
    width: number,
    height: number,
  ): ChartJSNodeCanvas {
    if (ChartRendererService.canvasRenderServices[`${width}x${height}`]) {
      return ChartRendererService.canvasRenderServices[`${width}x${height}`];
    }

    const canvasRenderService = new ChartJSNodeCanvas({
      width,
      height,
      backgroundColour: '#FFFFFF',
      type: 'svg',
    });

    ChartRendererService.canvasRenderServices[`${width}x${height}`] =
      canvasRenderService;

    return canvasRenderService;
  }
}
