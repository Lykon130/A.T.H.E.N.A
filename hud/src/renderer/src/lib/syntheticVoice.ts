/**
 * Fake amplitude envelope for the "speak-test" command, so the speaking wave
 * can be exercised from the command bar without voice/ actually running.
 * Live voice activity bypasses this entirely (see App.tsx's onVoiceActivity).
 */
export function syntheticAmplitude(elapsedS: number): number {
  const e1 = Math.sin((elapsedS * 2 * Math.PI) / 0.37)
  const e2 = Math.sin((elapsedS * 2 * Math.PI) / 0.61 + 1.3)
  const e3 = Math.sin((elapsedS * 2 * Math.PI) / 1.7 + 0.4)
  return Math.max(0, e1 * 0.4 + e2 * 0.35 + e3 * 0.25)
}
