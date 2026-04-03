import { OpenDentalConnector } from "./open-dental";
import type { PmsConnector } from "./types";

const connectors: Record<string, PmsConnector> = {
  open_dental: new OpenDentalConnector(),
  // dentrix: new DentrixConnector(),    — Phase 2
  // eaglesoft: new EaglesoftConnector(), — Phase 3
};

export function getConnector(pmsType: string): PmsConnector {
  const connector = connectors[pmsType];
  if (!connector) {
    throw new Error(`Unsupported PMS type: ${pmsType}`);
  }
  return connector;
}

export function getSupportedPmsTypes(): string[] {
  return Object.keys(connectors);
}
