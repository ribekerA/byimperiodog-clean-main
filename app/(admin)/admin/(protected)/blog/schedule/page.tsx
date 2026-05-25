"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { BlogSubnav } from "@/components/admin/BlogSubnav";
import ReindexEmbeddingsButton from "@/components/admin/ReindexEmbeddingsButton";
import { adminFetch } from "@/lib/adminFetch";

interface ScheduleEvent {
  id: string;
  post_id: string;
  run_at: string;
  action: string;
  executed_at: string | null;
  created_at?: string;
  payload?: unknown;
  blog_posts?: {
    id: string;
    title: string;
    slug: string;
    status: string;
    cover_url?: string | null;
    scheduled_at?: string | null;
  } | null;
}

interface PostOption {
  id: string;
  title: string;
  status: string;
  slug: string;
  scheduled_at?: string | null;
}

type CalendarCell = {
  iso: string;
  label: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: ScheduleEvent[];
};

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function startOfCalendarGrid(base: Date) {
  const first = startOfMonth(base);
  const day = first.getDay();
  const start = new Date(first);
  start.setDate(first.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

function endOfCalendarGrid(start: Date) {
  const end = new Date(start);
  end.setDate(end.getDate() + 42);
  end.setHours(0, 0, 0, 0);
  return end;
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildCalendar(date: Date, events: ScheduleEvent[]) {
  const baseMonth = date.getMonth();
  const start = startOfCalendarGrid(date);
  const end = endOfCalendarGrid(start);
  const map: Record<string, ScheduleEvent[]> = {};
  events.forEach((event) => {
    const dayKey = event.run_at.slice(0, 10);
    if (!map[dayKey]) map[dayKey] = [];
    map[dayKey].push(event);
  });
  Object.values(map).forEach((list) => list.sort((a, b) => a.run_at.localeCompare(b.run_at)));
  const cells: CalendarCell[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    const iso = toIsoDate(cursor);
    cells.push({
      iso,
      label: cursor.getDate(),
      isCurrentMonth: cursor.getMonth() === baseMonth,
      isToday: iso === toIsoDate(new Date()),
      events: map[iso] || [],
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return { cells, map };
}

function getDefaultDay(cells: CalendarCell[]) {
  if (!cells.length) return null;
  const todayIso = toIsoDate(new Date());
  const todayCell = cells.find((cell) => cell.iso === todayIso);
  if (todayCell) return todayCell.iso;
  const currentMonthCell = cells.find((cell) => cell.isCurrentMonth);
  return currentMonthCell ? currentMonthCell.iso : cells[0].iso;
}

function toInputDateTime(isoDate: string, time = "09:00") {
  return `${isoDate}T${time}`;
}

function normalizeRunAt(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return null;
  return new Date(timestamp).toISOString();
}

export default function BlogSchedulePage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [posts, setPosts] = useState<PostOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const calendar = useMemo(() => buildCalendar(month, events), [month, events]);
  const selectedEvents = useMemo(() => (selectedDay ? calendar.map[selectedDay] || [] : []), [calendar, selectedDay]);
  const upcoming = useMemo(() => {
    const now = Date.now();
    return [...events]
      .filter((ev) => Date.parse(ev.run_at) >= now)
      .sort((a, b) => a.run_at.localeCompare(b.run_at))
      .slice(0, 10);
  }, [events]);

  useEffect(() => {
    if (!calendar.cells.length) return;
    if (selectedDay && calendar.cells.some((cell) => cell.iso === selectedDay)) return;
    setSelectedDay(getDefaultDay(calendar.cells));
  }, [calendar.cells, selectedDay]);

  const fetchEvents = useCallback(async (targetMonth: Date) => {
    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const start = startOfCalendarGrid(targetMonth);
      const end = endOfCalendarGrid(start);
      const params = new URLSearchParams({ from: start.toISOString(), to: end.toISOString() });
      const res = await adminFetch(`/api/admin/blog/schedule/events?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erro ao carregar agenda");
      const items: ScheduleEvent[] = Array.isArray(json?.items) ? json.items : [];
      setEvents(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      const buckets: PostOption[] = [];
      for (const status of ["draft", "review", "scheduled"]) {
        const res = await adminFetch(`/api/admin/blog?perPage=50&status=${status}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Erro ao carregar posts");
        const items = Array.isArray(json?.items) ? json.items : [];
        items.forEach((item: any) => {
          if (!item?.id) return;
          buckets.push({
            id: item.id,
            title: item.title || "(sem titulo)",
            status: item.status || status,
            slug: item.slug || "",
            scheduled_at: item.scheduled_at || null,
          });
        });
      }
      const seen = new Set<string>();
      const unique = buckets.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      unique.sort((a, b) => a.title.localeCompare(b.title));
      setPosts(unique);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    fetchEvents(month);
  }, [fetchEvents, month]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  function changeMonth(delta: number) {
    setMonth((prev) => addMonths(prev, delta));
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este agendamento?")) return;
    try {
      setFeedback(null);
      const res = await adminFetch(`/api/admin/blog/schedule/events?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Falha ao remover");
      setFeedback("Agendamento removido");
      fetchEvents(month);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleCreate(event: { postId: string; runAt: string; action: string }) {
    try {
      setCreating(true);
      setFeedback(null);
      const iso = normalizeRunAt(event.runAt);
      if (!iso) throw new Error("Data invalida");
      const payload = { post_id: event.postId, run_at: iso, action: event.action };
      const res = await adminFetch("/api/admin/blog/schedule/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Falha ao agendar");
      setFeedback("Agendamento criado");
      fetchEvents(month);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <div className="space-y-6 px-4 py-6">
        <BlogSubnav />
        <header className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Agenda editorial</h1>
            <p className="max-w-2xl text-sm text-[var(--text-muted)]">
              Visualize publicacoes agendadas, organize campanhas sazonais e ajuste datas com rapidez. Clique em um dia para ver detalhes ou usar o formulario ao lado para criar novos agendamentos.
            </p>
            {feedback ? <p className="text-sm text-emerald-600">{feedback}</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="rounded-full border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--surface-2)]"
            >
              Mes anterior
            </button>
            <div className="rounded-full bg-[var(--surface-2)] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[var(--text)]">
              {monthFormatter.format(month)}
            </div>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="rounded-full border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--surface-2)]"
            >
              Proximo mes
            </button>
            <button
              type="button"
              onClick={() => changeMonth(0)}
              className="rounded-full border border-brand/40 px-3 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand/10"
            >
              Hoje
            </button>
            <ReindexEmbeddingsButton />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <section className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {[0, 1, 2, 3, 4, 5, 6].map((weekday) => {
                  const sample = new Date(2024, 7, 4 + weekday);
                  return (
                    <div key={weekday} className="px-3 py-2 text-center">
                      {weekdayFormatter.format(sample)}
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-7 gap-px bg-[var(--border)]">
                {calendar.cells.map((cell) => {
                  const isSelected = selectedDay === cell.iso;
                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      onClick={() => setSelectedDay(cell.iso)}
                      className={`flex min-h-[120px] flex-col gap-1 bg-[var(--surface)] p-3 text-left transition-colors hover:bg-[var(--surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                        cell.isCurrentMonth ? "" : "text-[var(--text-muted)]/70"
                      } ${isSelected ? "ring-2 ring-brand" : ""}`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>{cell.label}</span>
                        {cell.isToday ? <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] uppercase text-brand">Hoje</span> : null}
                      </div>
                      <div className="flex flex-col gap-1">
                        {cell.events.slice(0, 3).map((event) => (
                          <span
                            key={event.id}
                            className="truncate rounded-full bg-brand/10 px-2 py-1 text-[11px] font-medium text-brand"
                          >
                            {timeFormatter.format(new Date(event.run_at))} &mdash; {event.blog_posts?.title || event.post_id.slice(0, 6)}
                          </span>
                        ))}
                        {cell.events.length > 3 ? (
                          <span className="text-[11px] text-[var(--text-muted)]">+{cell.events.length - 3} agendamentos</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <DayDetails
              dayIso={selectedDay}
              events={selectedEvents}
              onDelete={handleDelete}
            />
          </section>

          <aside className="space-y-4">
            <ScheduleForm
              posts={posts}
              selectedDay={selectedDay}
              loading={creating}
              onSubmit={handleCreate}
            />
            <UpcomingList events={upcoming} onDelete={handleDelete} />
          </aside>
        </div>
      </div>
    </>
  );
}

function DayDetails({ dayIso, events, onDelete }: { dayIso: string | null; events: ScheduleEvent[]; onDelete: (id: string) => void }) {
  if (!dayIso) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--text-muted)]">
        Selecione um dia para visualizar detalhes.
      </div>
    );
  }
  const label = dateFormatter.format(new Date(`${dayIso}T00:00:00`));
  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{label}</h2>
        <span className="text-xs text-[var(--text-muted)]">{events.length} agendamentos</span>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Nenhum agendamento para este dia.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-[var(--text)]">
                    {timeFormatter.format(new Date(event.run_at))} &middot; {event.blog_posts?.title || "Post"}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {event.blog_posts?.status || "sem status"} &middot; {event.blog_posts?.slug || event.post_id}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Acao: {event.action} {event.executed_at ? `(executado em ${timeFormatter.format(new Date(event.executed_at))})` : ""}
                  </div>
                  <Link
                    href={`/admin/blog/editor?id=${event.post_id}`}
                    className="inline-flex items-center text-xs font-semibold text-brand hover:underline"
                  >
                    Abrir editor
                  </Link>
                </div>
                {!event.executed_at ? (
                  <button
                    type="button"
                    onClick={() => onDelete(event.id)}
                    className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ScheduleForm({
  posts,
  selectedDay,
  loading,
  onSubmit,
}: {
  posts: PostOption[];
  selectedDay: string | null;
  loading: boolean;
  onSubmit: (event: { postId: string; runAt: string; action: string }) => void;
}) {
  const [postId, setPostId] = useState("");
  const [customId, setCustomId] = useState("");
  const [runAt, setRunAt] = useState("");
  const [action, setAction] = useState("publish");
  const [lastAnchorDay, setLastAnchorDay] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDay) return;
    if (lastAnchorDay === selectedDay) return;
    setRunAt(toInputDateTime(selectedDay));
    setLastAnchorDay(selectedDay);
  }, [selectedDay, lastAnchorDay]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const effectiveId = postId || customId;
    if (!effectiveId) return;
    if (!runAt) return;
    onSubmit({ postId: effectiveId, runAt, action });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Novo agendamento</h2>
        <p className="text-xs text-[var(--text-muted)]">Escolha um post e defina data e hora. Posts marcados como draft ou review continuam acessiveis ate a publicacao automatica.</p>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Post sugerido</label>
        <select
          value={postId}
          onChange={(event) => setPostId(event.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
        >
          <option value="">Selecione um post</option>
          {posts.map((post) => (
            <option key={post.id} value={post.id}>
              {post.title} [{post.status}] {post.scheduled_at ? `- agendado para ${post.scheduled_at.slice(0, 10)}` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Ou informe ID manual</label>
        <input
          value={customId}
          onChange={(event) => setCustomId(event.target.value)}
          placeholder="UUID do post"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Data e hora</label>
        <input
          type="datetime-local"
          value={runAt}
          onChange={(event) => setRunAt(event.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Acao</label>
        <select
          value={action}
          onChange={(event) => setAction(event.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
        >
          <option value="publish">Publicar</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Agendando..." : "Agendar"}
      </button>
    </form>
  );
}

function UpcomingList({ events, onDelete }: { events: ScheduleEvent[]; onDelete: (id: string) => void }) {
  if (!events.length) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--text-muted)]">
        Nenhum agendamento futuro proximos 10 itens.
      </div>
    );
  }
  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Proximos agendamentos</h2>
        <span className="text-xs text-[var(--text-muted)]">{events.length}</span>
      </div>
      <ul className="space-y-3">
        {events.map((event) => (
          <li key={event.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[var(--text)]">
                  {dateFormatter.format(new Date(event.run_at))} &middot; {timeFormatter.format(new Date(event.run_at))}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {event.blog_posts?.title || event.post_id}
                </div>
              </div>
              {!event.executed_at ? (
                <button
                  type="button"
                  onClick={() => onDelete(event.id)}
                  className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
