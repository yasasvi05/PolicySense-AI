import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export const PALETTE = ['#0b1f44', '#2f6bff', '#6d89bd', '#9fb3d6', '#c9d5ea']
const axis = { fontSize: 12, fill: '#6d89bd' }
const tip = { borderRadius: 12, border: '1px solid #e5ebf5', boxShadow: '0 8px 24px -8px rgba(11,31,68,.15)', fontSize: 12 }

export const ChartCard = ({ title, subtitle, children, height = 240 }) => (
  <section className="card p-5">
    <h3 className="font-semibold text-navy-900">{title}</h3>
    {subtitle && <p className="text-xs text-navy-400">{subtitle}</p>}
    <div className="mt-4" style={{ height }}>{children}</div>
  </section>
)

export const Donut = ({ data }) => (
  <ResponsiveContainer>
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="88%" paddingAngle={2} stroke="none">
        {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
      </Pie>
      <Tooltip contentStyle={tip} />
      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
    </PieChart>
  </ResponsiveContainer>
)

export const Bars = ({ data, x = 'name', y = 'value', horizontal }) => (
  <ResponsiveContainer>
    <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ left: horizontal ? 24 : -16, right: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5ebf5" horizontal={!horizontal} vertical={!!horizontal} />
      {horizontal ? <><XAxis type="number" tick={axis} axisLine={false} tickLine={false} /><YAxis type="category" dataKey={x} tick={axis} width={150} axisLine={false} tickLine={false} /></>
        : <><XAxis dataKey={x} tick={axis} axisLine={false} tickLine={false} /><YAxis tick={axis} axisLine={false} tickLine={false} /></>}
      <Tooltip contentStyle={tip} cursor={{ fill: '#f3f6fb' }} />
      <Bar dataKey={y} fill="#0b1f44" radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} barSize={horizontal ? 16 : 28} />
    </BarChart>
  </ResponsiveContainer>
)

export const AreaTrend = ({ data, x, y }) => (
  <ResponsiveContainer>
    <AreaChart data={data} margin={{ left: -16, right: 8 }}>
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2f6bff" stopOpacity={0.3} /><stop offset="100%" stopColor="#2f6bff" stopOpacity={0} /></linearGradient></defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5ebf5" vertical={false} />
      <XAxis dataKey={x} tick={axis} axisLine={false} tickLine={false} /><YAxis tick={axis} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={tip} />
      <Area type="monotone" dataKey={y} stroke="#2f6bff" strokeWidth={2.5} fill="url(#g)" />
    </AreaChart>
  </ResponsiveContainer>
)

export const TwoLines = ({ data, x, a, b }) => (
  <ResponsiveContainer>
    <LineChart data={data} margin={{ left: -16, right: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5ebf5" vertical={false} />
      <XAxis dataKey={x} tick={axis} axisLine={false} tickLine={false} /><YAxis tick={axis} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={tip} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      <Line type="monotone" dataKey={a} stroke="#2f6bff" strokeWidth={2.5} dot={false} />
      <Line type="monotone" dataKey={b} stroke="#0b1f44" strokeWidth={2.5} dot={false} />
    </LineChart>
  </ResponsiveContainer>
)
