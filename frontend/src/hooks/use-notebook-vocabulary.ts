import { useEffect, useState } from 'react'
import { resolveNotebookVocabulary } from '@/services/notebook-content'
import type { NotebookResolution } from '@/types/notebook'

export function useNotebookVocabulary(ids: readonly string[]) {
  const [loaded, setLoaded] = useState<
    NotebookResolution & { ids: readonly string[]; request: number }
  >()
  const [request, setRequest] = useState(0)

  useEffect(() => {
    if (!ids.length) return
    let current = true
    void resolveNotebookVocabulary(ids).then((resolution) => {
      if (current) setLoaded({ ...resolution, ids, request })
    })
    return () => {
      current = false
    }
  }, [ids, request])

  return {
    loaded,
    loading:
      ids.length > 0 && (loaded?.ids !== ids || loaded.request !== request),
    retry: () => setRequest((previous) => previous + 1),
  }
}
