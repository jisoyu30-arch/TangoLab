import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: { year: number; count: number }[];
}

export function SongTrendChart({ data }: Props) {
  if (data.length < 2) return null;

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-tango-brass/10">
      <h3 className="text-sm font-semibold text-tango-brass mb-3">연도별 출현 추이</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="year" stroke="#666" fontSize={11} />
          <YAxis stroke="#666" fontSize={11} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#1A1A2E', border: '1px solid #C8A44E33', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#C8A44E' }}
          />
          <Bar dataKey="count" name="출현" fill="#C8A44E" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
