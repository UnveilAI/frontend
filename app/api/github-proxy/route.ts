import { NextRequest, NextResponse } from 'next/server'
import { FileNode } from '@/lib/file-processing'
import JSZip from 'jszip'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''

export async function POST(req: NextRequest) {
  try {
    const { repoUrl, branch = 'main' } = await req.json()

    const match = repoUrl.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/.*)?$/)
    if (!match) return NextResponse.json({ error: 'Invalid GitHub URL format' }, { status: 400 })

    const [, owner, repo] = match
    const archiveUrl = `https://codeload.github.com/${owner}/${repo}/zip/${branch}`

    const zipRes = await fetch(archiveUrl)
    if (!zipRes.ok) return NextResponse.json({ error: 'Failed to fetch ZIP' }, { status: 500 })

    const buffer = await zipRes.arrayBuffer()
    const zip = await JSZip.loadAsync(buffer)

    const root: FileNode[] = []

    await Promise.all(
      Object.entries(zip.files).map(async ([filePath, file]) => {
        if (file.dir) return

        const content = await file.async('string')
        const parts = filePath.split('/').slice(1) // remove top-level folder
        let current = root

        for (let i = 0; i < parts.length; i++) {
          const name = parts[i]
          const fullPath = parts.slice(0, i + 1).join('/')

          let node = current.find(n => n.name === name)
          if (!node) {
            node = {
              name,
              path: fullPath,
              type: i === parts.length - 1 ? 'file' : 'directory',
              selected: false,
              ...(i === parts.length - 1 ? { content } : { children: [] })
            }
            current.push(node as FileNode)
          }

          if (node.type === 'directory') {
            current = node.children!
          }
        }
      })
    )

    return NextResponse.json({ files: root })
  } catch (err: any) {
    console.error('[route.ts] Unhandled error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}