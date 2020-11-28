import { Injectable } from '@nestjs/common';
import { CanvasRenderService } from 'chartjs-node-canvas';
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

    const configuration = {
      type: 'line',
      backgroundColor: '#F5DEB3',
      data: {
        datasets: [
          {
            data: mapLineChartData(servers),
            label:
              servers[servers.length - 1][1].toLocaleString('en-US') +
              ' Servers',
            borderColor: 'rgb(23, 150, 243)',
            backgroundColor: 'rgba(23, 150, 243, 0.6)',
            borderWidth: 2,
            fill: 'origin',
            pointRadius: 0,
            order: 0,
          },
          {
            data: mapLineChartData(players),
            label:
              players[players.length - 1][1].toLocaleString('en-US') +
              ' Players',
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
        title: {
          display: true,
          text: title,
          fontSize: 18,
          fontStyle: 'none',
          fontColor: '#444',
        },
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            fontSize: 12,
            fontColor: '#000',
            padding: 15,
          },
        },
        scales: {
          xAxes: [
            {
              type: 'time',
              time: {
                unit: 'day',
              },
              gridLines: {
                display: false,
              },
            },
          ],
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                autoSkip: true,
                maxTicksLimit: 6,
                callback: function (label) {
                  if (maxValue > 5000) {
                    return label / 1000 + 'k';
                  } else {
                    return label;
                  }
                },
              },
            },
          ],
        },
      },
    };

    // For some reason, it is not possible to render SVG async
    return canvasRenderService.renderToBufferSync(
      configuration,
      'image/svg+xml',
    );
  }

  private static getCanvasRenderService(
    width: number,
    height: number,
  ): CanvasRenderService {
    const chartCallback = (ChartJS) => {
      ChartJS.defaults.global.elements.rectangle.borderWidth = 2;
      ChartJS.plugins.register({
        // Max background white
        beforeDraw: function (chartInstance) {
          const ctx = chartInstance.chart.ctx;
          ctx.fillStyle = 'white';
          ctx.fillRect(
            0,
            0,
            chartInstance.chart.width,
            chartInstance.chart.height,
          );
        },
      });
    };

    return new CanvasRenderService(width, height, chartCallback, 'svg');
  }
}
