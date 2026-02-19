import React from 'react';
import { AstralConsoleLayout } from './AstralConsoleLayout';


/**
 * AstralConsole — public entry point for the module.
 *
 * Drop this anywhere in the existing app's router:
 *   <Route path="/console" element={<AstralConsole />} />
 *
 * This wrapper exists so we can add an ErrorBoundary or providers
 * here in the future without touching AstralConsoleLayout.
 */
export default function AstralConsole() {
  return <AstralConsoleLayout/>;
}
