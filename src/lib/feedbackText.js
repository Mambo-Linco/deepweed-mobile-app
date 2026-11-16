// Feedback created from the identify flow stores a default English message when the farmer wrote none.
// Hide those so the translated verdict label is shown instead.
const DEFAULTS = ['Identification confirmed correct', 'Identification marked incorrect']
export const isDefaultMessage = (m) => DEFAULTS.includes(m)
export const confPct = (c) => (c == null ? '' : Number(c).toFixed(1))
