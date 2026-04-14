import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { SongRanking } from '../../types/tango';

interface Props {
  rankings: SongRanking[];
  count?: number;
}

export function SongRankingChart({ rankings, count = 20 }: Props) {
  const data = rankings.slice(0, count).map(r => ({
    name: r.title.length > 20 ? r.title.slice(0, 20) + '…' : r.title,
    fullName: r.title,
    orchestra: r.orchestra ?? '-',
    weighted: r.weighted_score,
    total: r.total_appearances,
    final: r.final_count,
    semi: r.semifinal_count,
    qual: r.qualifying_count,
  }));

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-secretary-gold/10">
      <h3 className="text-sm font-semibold text-secretary-gold mb-4">빈출곡 TOP {count} (가중점수 기준)</h3>
      <ResponsiveContainer width="100%" height={500}>
        <BarChart data={data} layout="vertical" margin={{ left: 140, right: 20 }}>
          <XAxis type="number" stroke="#666" fontSize={11} />
          <YAxis type="category" dataKey="name" stroke="#999" fontSize={11} width={140} />
          <Tooltip
            contentStyle={{ background: '#1A1A2E', border: '1px solid #C8A44E33', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#C8A44E' }}
            formatter={(value, name) => {
              const labels: Record<string, string> = { weighted: '가중점수', total: '출현횟수', final: '결승', semi: '준결승', qual: '예선' };
              return [value, labels[String(name)] ?? name];
            }}
            labelFormatter={(_label, payload) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const item = (payload as any)?.[0]?.payload;
              return item ? `${item.fullName} (${item.orchestra})` : '';
            }}
          />
          <Bar dataKey="weighted" name="weighted" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i < 3 ? '#C8A44E' : i < 10 ? '#C8A44E88' : '#C8A44E44'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
