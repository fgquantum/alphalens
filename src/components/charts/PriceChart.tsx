'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import type { OHLCV } from '@/lib/types';

interface PriceChartProps {
  data: OHLCV[];
  symbol: string;
}

const PERIODS = ['1D', '5D', '1M', '3M', '6M', '1Y', '2Y', '5Y'];

export function PriceChart({ data, symbol }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [period, setPeriod] = useState('1Y');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    // Clear previous chart safely
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {
        // already disposed
      }
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#8b8da0',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(42, 43, 58, 0.5)' },
        horzLines: { color: 'rgba(42, 43, 58, 0.5)' },
      },
      crosshair: {
        vertLine: { color: '#6366f1', width: 1, style: 2 },
        horzLine: { color: '#6366f1', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: '#2a2b3a',
      },
      timeScale: {
        borderColor: '#2a2b3a',
        timeVisible: true,
      },
      width: containerRef.current.clientWidth,
      height: 400,
    });

    const formattedData = data.map(d => ({
      time: d.date as string,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    if (chartType === 'candle') {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        wickUpColor: '#22c55e',
      });
      series.setData(formattedData);
    } else {
      const series = chart.addSeries(LineSeries, {
        color: '#6366f1',
        lineWidth: 2,
      });
      series.setData(formattedData.map(d => ({ time: d.time, value: d.close })));
    }

    // Volume
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#6366f140',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeries.setData(
      data.map(d => ({
        time: d.date as string,
        value: d.volume,
        color: d.close >= d.open ? '#22c55e30' : '#ef444430',
      }))
    );

    chart.timeScale().fitContent();
    chartRef.current = chart;

    // Resize handler
    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      try {
        chart.remove();
      } catch (e) {
        // ignore
      }
    };
  }, [data, chartType]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-accent/20 text-accent-light'
                  : 'text-muted-2 hover:text-muted hover:bg-surface-2'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setChartType('candle')}
            className={`px-2 py-1 rounded text-xs ${chartType === 'candle' ? 'bg-surface-3 text-foreground' : 'text-muted-2'}`}
          >
            Candle
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`px-2 py-1 rounded text-xs ${chartType === 'line' ? 'bg-surface-3 text-foreground' : 'text-muted-2'}`}
          >
            Line
          </button>
        </div>
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
