/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface QuantumState {
  rho: number[][]; // Density matrix (simplified for simulation)
  entanglement: number; // E(t)
  integratedInformation: number; // Phi(t)
  compositeIndex: number; // C(t)
  precision: number; // pi(t)
}

export interface NeuralState {
  voltages: number[]; // V_i(t)
  weights: number[][]; // w_ij
  noise: number; // sigma_i
}

export type UserRole = "ADMIN" | "MAINTAINER" | "DEVELOPER" | "COLLABORATOR";

export interface Case {
  id: string;
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string; // ISO string
  slaResponseLimit: string; // ISO string
  slaResolutionLimit: string; // ISO string
  hash: string;
  metadata: {
    category: "CTIP" | "ICAC" | "ILLICIT_TRADE" | "GENERAL";
    assignedTo?: string;
    forensicVerified: boolean;
  };
}

export interface AeriaCoreState {
  quantum: QuantumState;
  neural: NeuralState;
  user: {
    role: UserRole;
    authenticated: boolean;
    twoFactorEnabled: boolean;
  };
  loops: {
    reasoning: "idle" | "parsing" | "planning" | "reasoning" | "verifying";
    metacognition: number; // uncertainty [0,1]
    safety: "clear" | "checking" | "blocked";
    memory: string[];
    learning: number; // learning rate
  };
  gatekeeper: {
    escalationLevel: "NONE" | "CONSERVATIVE" | "PROACTIVE";
    activeCases: Case[];
    evidenceLog: {
      timestamp: string;
      event: string;
      hash: string;
      agentId: string;
    }[];
  };
  timestamp: number;
}

export type LoopType = 'R' | 'M' | 'S' | 'Mem' | 'L';
