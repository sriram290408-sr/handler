import { useEffect, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getDashboard } from "../services/api";

const COLORS = ["#4f46e5", "#7c3aed", "#0ea5e9", "#f59e0b", "#ef4444", "#22c55e", "#ec4899"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getDashboard();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <p className="text-gray-500">Loading dashboard...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  const chartData = data.standards.map((item) => ({
    standard: `Standard ${item.standard}`,
    value: item.count,
    percentage: item.percentage,
    label: `Std ${item.standard} - ${item.percentage}% (${item.count})`,
  }));

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold text-gray-900">Dashboard</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow">
          <h4 className="mb-1 text-sm text-gray-500">Total Students</h4>
          <p className="text-2xl font-bold text-indigo-600">{data.total_students}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow md:col-span-2">
          <p className="mb-2 text-sm text-gray-500">Distribution by Standard</p>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="standard"
                  cx="40%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => entry.label}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={entry.standard} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, _name, props) => [`${value} students (${props.payload.percentage}%)`, props.payload.standard]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
