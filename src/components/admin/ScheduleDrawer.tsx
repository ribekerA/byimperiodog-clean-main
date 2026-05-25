"use client";
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import * as React from 'react';

export function ScheduleDrawer({ open, onOpenChange, onConfirm, defaultDate, defaultTime }:{ open:boolean; onOpenChange:(v:boolean)=>void; onConfirm:(iso:string)=>void; defaultDate?:string; defaultTime?:string }){
  const [date,setDate]=React.useState('');
  const [time,setTime]=React.useState('09:00');
  React.useEffect(()=>{
    if(open){
      if(defaultDate) setDate(defaultDate);
      if(defaultTime) setTime(defaultTime);
    }
  },[open, defaultDate, defaultTime]);
  function confirm(){ if(date){ onConfirm(`${date}T${time}:00Z`); onOpenChange(false);} }
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed bottom-0 right-0 z-50 w-full max-w-md rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl outline-none">
          <div className="mb-2 flex items-center justify-between">
            <Dialog.Title className="text-sm font-semibold">Agendar publicação</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Fechar" className="rounded p-2 hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"><Cross2Icon /></button>
            </Dialog.Close>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <label htmlFor="sched-date" className="block text-[12px] text-[var(--text-muted)]">Data</label>
              <input id="sched-date" type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40" />
            </div>
            <div>
              <label htmlFor="sched-time" className="block text-[12px] text-[var(--text-muted)]">Hora</label>
              <input id="sched-time" type="time" value={time} onChange={e=>setTime(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40" />
            </div>
            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <button className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]">Cancelar</button>
              </Dialog.Close>
              <button onClick={confirm} className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-contrast)] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--accent)]" disabled={!date}>Agendar</button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
