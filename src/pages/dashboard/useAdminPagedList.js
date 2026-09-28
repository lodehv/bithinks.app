import { useCallback, useEffect, useRef, useState } from 'react'

export default function useAdminPagedList({ query, fetchPage, errorMessage, debounceMs = 0 }) {
  const [rows, setRows] = useState([])
  const [cursor, setCursor] = useState(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const requestId = useRef(0)
  const appendId = useRef(0)
  const cursorRef = useRef(null)
  const appendBusy = useRef(false)

  useEffect(() => {
    const request = ++requestId.current
    appendId.current += 1
    appendBusy.current = false
    cursorRef.current = null
    const timer = window.setTimeout(async () => {
      setRows([])
      setCursor(null)
      setError('')
      setBusy(true)
      try {
        const data = await fetchPage(query, null)
        if (request !== requestId.current) return
        const nextRows = data?.rows ?? []
        setRows(nextRows)
        cursorRef.current = data?.nextCursor ?? null
        setCursor(cursorRef.current)
      } catch {
        if (request === requestId.current) setError(errorMessage)
      } finally {
        if (request === requestId.current) setBusy(false)
      }
    }, query.trim() ? debounceMs : 0)
    return () => {
      window.clearTimeout(timer)
      if (request === requestId.current) requestId.current += 1
    }
  }, [query, fetchPage, errorMessage, debounceMs])

  useEffect(() => () => {
    requestId.current += 1
    appendId.current += 1
  }, [])

  const invalidate = useCallback(() => {
    requestId.current += 1
    appendId.current += 1
    appendBusy.current = false
    cursorRef.current = null
    setRows([])
    setCursor(null)
    setError('')
    setBusy(true)
  }, [])

  const refresh = useCallback(async () => {
    const request = ++requestId.current
    appendId.current += 1
    appendBusy.current = false
    cursorRef.current = null
    setCursor(null)
    setRows([])
    setError('')
    setBusy(true)
    try {
      const data = await fetchPage(query, null)
      if (request !== requestId.current) return
      setRows(data?.rows ?? [])
      cursorRef.current = data?.nextCursor ?? null
      setCursor(cursorRef.current)
    } catch {
      if (request === requestId.current) setError(errorMessage)
    } finally {
      if (request === requestId.current) setBusy(false)
    }
  }, [fetchPage, errorMessage, query])

  const loadNext = useCallback(async () => {
    const requestedCursor = cursorRef.current
    const request = requestId.current
    if (!requestedCursor || appendBusy.current) return
    const appendRequest = ++appendId.current
    appendBusy.current = true
    setBusy(true)
    setError('')
    try {
      const data = await fetchPage(query, requestedCursor)
      if (request !== requestId.current || appendRequest !== appendId.current) return
      setRows((current) => [...current, ...(data?.rows ?? [])])
      cursorRef.current = data?.nextCursor ?? null
      setCursor(cursorRef.current)
    } catch {
      if (request === requestId.current && appendRequest === appendId.current) setError(errorMessage)
    } finally {
      if (appendRequest === appendId.current) {
        appendBusy.current = false
        if (request === requestId.current) setBusy(false)
      }
    }
  }, [fetchPage, errorMessage, query])

  return { rows, cursor, busy, error, refresh, loadNext, invalidate }
}
