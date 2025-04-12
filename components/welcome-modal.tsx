"use client"

import React from 'react'
import { Button } from '@/components/ui/button'

interface WelcomeModalProps {
  onClose: () => void
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-card border border-white/20 p-8 rounded-lg text-center animate-glow-border shadow-2xl relative">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Welcome to <span className="text-primary">UnveilAI</span></h2>
        <p className="text-muted-foreground mb-6">
          Your personal teacher for all things code.
        </p>
        <Button onClick={onClose} className="w-full">Enter</Button>
      </div>
    </div>
  )
}