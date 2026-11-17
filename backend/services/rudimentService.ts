import type { Rudiment } from "../types.ts";
import { findAllRudiments, findRudimentById } from "../repositories/rudimentRepository.ts";

export function getAllRudiments(): Rudiment[] {
  return findAllRudiments();
}

export function getRudimentById(id: string): Rudiment | undefined {
  return findRudimentById(id);
}