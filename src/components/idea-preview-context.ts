import { createContext, useContext } from 'react';

/**
 * True when the current subtree is rendered inside a non-interactive
 * preview (e.g. an idea card). Components should avoid emitting <a>
 * elements here since the preview itself sits inside a Link.
 */
export const PreviewContext = createContext(false);

export function useIsInPreview() {
  return useContext(PreviewContext);
}
