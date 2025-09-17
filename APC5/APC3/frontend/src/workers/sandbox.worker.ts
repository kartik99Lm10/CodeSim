// Simple JS sandbox runner. Not for untrusted code in production.

type InMsg = { code: string }

function send(type: string, payload: unknown) {
  // @ts-ignore
  postMessage({ type, payload })
}

// Override console to capture outputs
const capturedConsole = {
  log: (...args: unknown[]) => send('log', args.map(String).join(' ')),
  error: (...args: unknown[]) => send('error', args.map(String).join(' ')),
  warn: (...args: unknown[]) => send('warn', args.map(String).join(' ')),
}

// @ts-ignore
self.onmessage = (e: MessageEvent<InMsg>) => {
  const { code } = e.data
  try {
    // sandboxed global
    const sandboxConsole = capturedConsole
    // eslint-disable-next-line no-new-func
    const fn = new Function('console', `'use strict';\n${code}`)
    const result = fn(sandboxConsole)
    if (typeof result !== 'undefined') {
      send('result', String(result))
    }
    send('done', null)
  } catch (err: any) {
    send('error', String(err && err.stack ? err.stack : err))
    send('done', null)
  }
}


