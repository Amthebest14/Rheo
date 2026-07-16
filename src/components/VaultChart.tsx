import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export interface ChartDataPoint {
  timestamp: string;
  tvl: number;
  apy: number;
}

interface VaultChartProps {
  data: ChartDataPoint[];
  dataKey: 'tvl' | 'apy';
}

const CustomTooltip = ({ active, payload, label, dataKey }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const formatted = dataKey === 'tvl' 
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(value)
      : `${value.toFixed(2)}%`;

    return (
      <div className="bg-[#0A0F1C]/90 backdrop-blur-md border border-white/[0.05] p-3 rounded-xl shadow-card">
        <p className="text-slate-muted text-[10px] uppercase tracking-widest font-semibold mb-1">{label}</p>
        <p className="text-cyan-electric font-bold text-lg tabular-nums">{formatted}</p>
      </div>
    );
  }
  return null;
};

export default function VaultChart({ data, dataKey }: VaultChartProps) {
  return (
    <div className="w-full h-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
          <XAxis 
            dataKey="timestamp" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748B', fontSize: 10 }}
            dy={10}
            minTickGap={30}
          />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip content={<CustomTooltip dataKey={dataKey} />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="#00E5FF"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorGradient)"
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
