"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart } from "recharts";
import { Loader2 } from "lucide-react";

interface ParetoData {
  category: string;
  reason: string;
  label: string;
  duration: number;
  percentage: number;
  cumulativePercentage: number;
  occurrences: number;
}

interface ParetoResponse {
  paretoData: ParetoData[];
  totalDuration: number;
  totalOccurrences: number;
}

interface ParetoChartProps {
  studyId: string;
}

export default function ParetoChart({ studyId }: ParetoChartProps) {
  const [data, setData] = useState<ParetoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchParetoData();
  }, [studyId]);

  const fetchParetoData = async () => {
    try {
      const response = await fetch(`/api/analytics/${studyId}/pareto`);
      if (!response.ok) {
        throw new Error("Failed to fetch Pareto data");
      }
      const paretoData = await response.json();
      setData(paretoData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading Pareto chart...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button
          onClick={fetchParetoData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.paretoData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-2">No data available</p>
        <p className="text-sm text-muted-foreground">
          Add some S1 downtime data to generate the Pareto chart
        </p>
      </div>
    );
  }

  // Prepare chart data with shortened labels for better display
  const chartData = data.paretoData.map((item, index) => ({
    ...item,
    shortLabel: `${index + 1}. ${item.reason.length > 20 ? item.reason.substring(0, 20) + '...' : item.reason}`,
    index: index + 1,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <h4 className="font-semibold">{data.label}</h4>
          <p className="text-sm">
            <span className="text-blue-600">Duration:</span> {data.duration} minutes ({data.percentage.toFixed(1)}%)
          </p>
          <p className="text-sm">
            <span className="text-green-600">Occurrences:</span> {data.occurrences}
          </p>
          <p className="text-sm">
            <span className="text-purple-600">Cumulative:</span> {data.cumulativePercentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-600">{data.totalDuration}</div>
          <p className="text-sm text-muted-foreground">Total Downtime (min)</p>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">{data.totalOccurrences}</div>
          <p className="text-sm text-muted-foreground">Total Incidents</p>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-600">{data.paretoData.length}</div>
          <p className="text-sm text-muted-foreground">Loss Categories</p>
        </div>
        <div>
          <div className="text-2xl font-bold text-orange-600">
            {data.paretoData[0]?.percentage.toFixed(1) || 0}%
          </div>
          <p className="text-sm text-muted-foreground">Top Loss</p>
        </div>
      </div>

      {/* Pareto Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="shortLabel" 
              angle={-45}
              textAnchor="end"
              height={100}
              fontSize={12}
            />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            <Bar
              yAxisId="left"
              dataKey="duration"
              fill="#3b82f6"
              name="Duration (minutes)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulativePercentage"
              stroke="#ef4444"
              strokeWidth={3}
              name="Cumulative %"
              dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Table */}
      <div className="border rounded-lg">
        <div className="px-4 py-2 bg-gray-50 border-b">
          <h3 className="font-semibold">Detailed Loss Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Rank</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Reason</th>
                <th className="px-4 py-2 text-right">Duration (min)</th>
                <th className="px-4 py-2 text-right">Percentage</th>
                <th className="px-4 py-2 text-right">Cumulative %</th>
                <th className="px-4 py-2 text-right">Occurrences</th>
              </tr>
            </thead>
            <tbody>
              {data.paretoData.map((item, index) => (
                <tr key={item.label} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2 font-medium">{index + 1}</td>
                  <td className="px-4 py-2">{item.category}</td>
                  <td className="px-4 py-2">{item.reason}</td>
                  <td className="px-4 py-2 text-right">{item.duration}</td>
                  <td className="px-4 py-2 text-right">{item.percentage.toFixed(1)}%</td>
                  <td className="px-4 py-2 text-right font-medium">{item.cumulativePercentage.toFixed(1)}%</td>
                  <td className="px-4 py-2 text-right">{item.occurrences}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 80/20 Analysis */}
      {data.paretoData.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">80/20 Analysis</h4>
          <p className="text-sm text-muted-foreground">
            {data.paretoData.filter(item => item.cumulativePercentage <= 80).length} out of {data.paretoData.length} loss categories account for approximately 80% of total downtime.
            Focus on these key areas for maximum impact on reducing losses.
          </p>
        </div>
      )}
    </div>
  );
}
