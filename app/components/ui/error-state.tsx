'use client'

import { motion } from 'framer-motion'

interface ErrorStateProps {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

export default function ErrorState({ title, description, actionLabel, onAction }: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center"
    >
      <h2 className="text-xl font-semibold text-red-800">{title}</h2>
      <p className="text-red-600">{description}</p>
      <button
        onClick={onAction}
        className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
      >
        {actionLabel}
      </button>
    </motion.div>
  )
}