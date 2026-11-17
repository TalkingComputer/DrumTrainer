// Taktgeber für den Scheduler, läuft in einem Web Worker.
//
// Warum ein Worker? Browser bremsen Timer (setInterval) im Hauptprogramm stark,
// sobald der Tab im Hintergrund liegt: oft auf einmal pro Sekunde. Der Scheduler
// plant aber nur 100 ms im Voraus. Ohne Worker würden im Hintergrund Klicks fehlen.
// Ein Worker ist ein eigener Thread. Seine Timer werden deutlich weniger gebremst.
//
// Der Worker selbst spielt keinen Ton. Er schickt nur alle 25 ms ein "tick"
// an das Hauptprogramm. Dort plant der Scheduler die nächsten Klicks.

let timerId: number | undefined = undefined

interface TimerCommand {
  command: 'start' | 'stop'
  intervalMs?: number
}

self.onmessage = (event: MessageEvent<TimerCommand>) => {
  if (event.data.command === 'start') {
    clearInterval(timerId)
    timerId = setInterval(() => {
      postMessage('tick')
    }, event.data.intervalMs ?? 25)
  } else {
    clearInterval(timerId)
    timerId = undefined
  }
}
