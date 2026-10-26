import { ArrowDown, Brain, Database, MessageSquare, Server, Sparkles, Workflow } from 'lucide-react'

const Node = ({ icon: Icon, title, sub, tone = 'navy' }) => (
  <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${tone === 'azure' ? 'border-azure-100 bg-azure-50' : 'border-navy-100 bg-white'}`}>
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone === 'azure' ? 'bg-azure-600 text-white' : 'bg-navy-900 text-white'}`}><Icon className="h-[18px] w-[18px]" /></span>
    <div className="min-w-0"><p className="text-sm font-semibold text-navy-900">{title}</p><p className="text-xs text-navy-500">{sub}</p></div>
  </div>
)
const Down = () => <ArrowDown className="mx-auto my-1.5 h-4 w-4 text-navy-300" />

/** Static illustration of the real architecture (what the backend does when connected). */
export default function ArchitectureFlow() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Node icon={MessageSquare} title="Customer query" sub="“Why was I charged ₹500 extra?”" />
      <Down />
      <Node icon={Server} title="FastAPI" sub="Authenticates and scopes to the customer" />
      <Down />
      <div className="grid grid-cols-2 gap-2.5">
        <Node icon={Database} title="PostgreSQL" sub="What happened to the customer" tone="azure" />
        <Node icon={Database} title="ChromaDB" sub="What the policy says" tone="azure" />
      </div>
      <Down />
      <Node icon={Workflow} title="LangChain" sub="Combines both contexts into one prompt" />
      <Down />
      <Node icon={Brain} title="Gemini LLM" sub="Explains why the clause applies" />
      <Down />
      <Node icon={Sparkles} title="Personalised answer" sub="With the sources that produced it" tone="azure" />
    </div>
  )
}
