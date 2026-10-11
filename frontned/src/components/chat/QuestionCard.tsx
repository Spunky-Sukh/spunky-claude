import { MessageCircleQuestion, Send } from 'lucide-react'
import { useState } from 'react'
import type { QuestionRequest } from '../../types'
import { Button } from '../common/ui'
import { Chip } from './PermissionCard'

/** Interactive version of Claude's AskUserQuestion tool: option chips + free-text "Other". */
export function QuestionCard({ req, onAnswer }: { req: QuestionRequest; onAnswer: (answers: Record<string, string>) => void }) {
  const [picked, setPicked] = useState<Record<string, string[]>>({})
  const [other, setOther] = useState<Record<string, string>>({})

  const toggle = (question: string, label: string, multi: boolean) =>
    setPicked((p) => {
      const cur = p[question] ?? []
      if (!multi) return { ...p, [question]: [label] }
      return { ...p, [question]: cur.includes(label) ? cur.filter((l) => l !== label) : [...cur, label] }
    })

  const answerFor = (q: string) => [...(picked[q] ?? []), ...(other[q]?.trim() ? [other[q].trim()] : [])].join(', ')
  const complete = req.questions.every((q) => answerFor(q.question))

  const submit = () => onAnswer(Object.fromEntries(req.questions.map((q) => [q.question, answerFor(q.question)])))

  // Single question, single-select: one click answers immediately.
  const instant = req.questions.length === 1 && !req.questions[0].multiSelect

  return (
    <div className="space-y-5 rounded-xl border-2 border-accent/50 bg-surface p-4 shadow-sm">
      {req.questions.map((q) => (
        <div key={q.question}>
          <div className="mb-2 flex items-start gap-2">
            <MessageCircleQuestion className="mt-0.5 size-5 shrink-0 text-accent" />
            <div>
              {q.header && <div className="text-[10px] font-semibold uppercase tracking-wider text-accent">{q.header}</div>}
              <div className="font-medium">{q.question}</div>
              {q.multiSelect && <div className="text-xs text-muted">Pick one or more</div>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pl-7">
            {q.options.map((o) => (
              <div key={o.label} title={o.description}>
                <Chip
                  active={(picked[q.question] ?? []).includes(o.label)}
                  onClick={() =>
                    instant ? onAnswer({ [q.question]: o.label }) : toggle(q.question, o.label, !!q.multiSelect)
                  }
                >
                  {o.label}
                </Chip>
              </div>
            ))}
          </div>
          {q.options.some((o) => o.description) && (
            <ul className="mt-2 space-y-0.5 pl-7 text-xs text-muted">
              {q.options.map((o) => o.description && <li key={o.label}><b>{o.label}:</b> {o.description}</li>)}
            </ul>
          )}
          <input
            value={other[q.question] ?? ''}
            onChange={(e) => setOther((s) => ({ ...s, [q.question]: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && complete && submit()}
            placeholder="Other… type your own answer"
            className="mt-2 ml-7 h-9 w-[calc(100%-1.75rem)] rounded-lg border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
          />
        </div>
      ))}
      {(!instant || other[req.questions[0].question]) && (
        <div className="flex justify-end">
          <Button variant="primary" size="sm" disabled={!complete} onClick={submit}>
            <Send className="size-3.5" /> Submit answers
          </Button>
        </div>
      )}
    </div>
  )
}
