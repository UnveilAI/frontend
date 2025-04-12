"use client"

import React from 'react'
import { X, LinkSimple, TwitterLogo, FacebookLogo } from 'phosphor-react'
import { Button } from '@/components/ui/button'

type ShareOptionsModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function ShareOptionsModal({ isOpen, onClose }: ShareOptionsModalProps) {
  if (!isOpen) return null

  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      alert('Link copied to clipboard!')
    } catch (err) {
      alert('Failed to copy the link.')
    }
  }

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      currentUrl
    )}&text=${encodeURIComponent('Check out Unveil AI!')}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  const handleShareFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      currentUrl
    )}`
    window.open(facebookUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-sm p-4 bg-card rounded shadow-lg">
        <button
          className="absolute top-2 right-2 text-foreground"
          onClick={onClose}
          aria-label="Close Share Options"
        >
          <X size={20} />
        </button>
        <h2 className="mb-4 text-lg font-semibold text-center">Share Unveil AI</h2>
        <div className="space-y-3">
          <Button onClick={handleCopyLink} className="w-full flex items-center justify-center gap-2">
            <LinkSimple size={20} />
            Copy Link
          </Button>
          <Button onClick={handleShareTwitter} className="w-full flex items-center justify-center gap-2">
            <TwitterLogo size={20} />
            Share on Twitter
          </Button>
          <Button onClick={handleShareFacebook} className="w-full flex items-center justify-center gap-2">
            <FacebookLogo size={20} />
            Share on Facebook
          </Button>
        </div>
      </div>
    </div>
  )
}