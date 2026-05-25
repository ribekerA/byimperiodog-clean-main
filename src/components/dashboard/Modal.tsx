"use client";
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { AnimatePresence, motion } from 'framer-motion';
import * as React from 'react';

interface ModalProps {
  open:boolean;
  onOpenChange:(v:boolean)=>void;
  title?:string;
  description?:string;
  children:React.ReactNode;
  footer?:React.ReactNode;
  destructive?:boolean;
  size?: 'sm'|'md'|'lg'|'xl'; // controla largura máxima
}

export function Modal({ open, onOpenChange, title, description, children, footer, destructive, size='md' }:ModalProps){
  const reduced = typeof window!=='undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const widthClass = {
    sm: 'max-w-[420px]',
    md: 'max-w-[640px]',
    lg: 'max-w-[820px]',
    xl: 'max-w-[960px]'
  }[size];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:.18}} className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px]" />
            </Dialog.Overlay>
    <div className="fixed inset-0 z-[95] flex items-start sm:items-center justify-center p-4 overflow-y-auto">
              <Dialog.Content asChild>
                <motion.div
                  initial={{opacity:0, y:24, scale:.98}}
                  animate={{opacity:1,y:0, scale:1}}
                  exit={{opacity:0,y:12, scale:.98}}
                  transition={{type:'tween', duration:reduced?0:.22}}
      className={`relative w-full ${widthClass} bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl focus:outline-none max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden`}
                  role="dialog"
                  aria-modal="true"
                >
                  <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-[var(--border)] sticky top-0 bg-[var(--surface)] rounded-t-2xl">
                    <div className="pr-6">
                      {title && <Dialog.Title className="text-base font-semibold tracking-tight">{title}</Dialog.Title>}
                      {description && <Dialog.Description className="mt-1 text-[13px] text-[var(--text-muted)] leading-snug">{description}</Dialog.Description>}
                    </div>
                    <Dialog.Close asChild>
                      <button aria-label="Fechar" className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"><Cross2Icon /></button>
                    </Dialog.Close>
                  </div>
      <div className="px-6 pt-4 pb-6 overflow-y-auto custom-scrollbar text-sm leading-relaxed break-words">
                    {children}
                  </div>
                  {(footer || destructive) && (
                    <div className="px-6 pt-4 pb-6 border-t border-[var(--border)] bg-[var(--surface)] rounded-b-2xl flex flex-col gap-4">
                      {footer && <div className="flex flex-wrap items-center justify-end gap-2">{footer}</div>}
                      {destructive && <p className="text-[11px] font-medium text-[var(--error)]">Ação irreversível. Confirme cuidadosamente.</p>}
                    </div>
                  )}
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}