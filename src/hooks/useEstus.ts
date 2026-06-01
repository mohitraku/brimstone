import { useCallback } from "react";
import { getDatabase, getFlameState, updateFlameState } from "@/db/database";
import { insertDecayLog } from "@/db/decay";
import { v4 as uuid } from "uuid";

/**
 * Estus charges: max 2, regen 1 every 24 hours, manual use only.
 */
export function useEstus(refreshFlame: () => Promise<void>) {
  const useCharge = useCallback(
    async (flameIntensity: number, commitmentId: string) => {
      const db = await getDatabase();
      const state = await getFlameState(db);
      if (!state || state.current_estus <= 0) return false;

      // Consume one charge
      await updateFlameState(db, {
        current_estus: state.current_estus - 1,
        last_estus_regen: new Date().toISOString(),
      });

      // Log the forgiveness
      await insertDecayLog(
        uuid(),
        flameIntensity,
        flameIntensity, // no decay happened
        0,
        "estus_forgive"
      );

      await refreshFlame();
      return true;
    },
    [refreshFlame]
  );

  const checkRegen = useCallback(async () => {
    const db = await getDatabase();
    const state = await getFlameState(db);
    if (!state) return;

    const now = new Date();
    const lastRegen = new Date(state.last_estus_regen);
    const hoursSinceRegen =
      (now.getTime() - lastRegen.getTime()) / (1000 * 60 * 60);

    const chargesToRestore = Math.floor(hoursSinceRegen / 24);
    if (chargesToRestore <= 0) return;

    const newEstus = Math.min(
      state.max_estus,
      state.current_estus + chargesToRestore
    );

    if (newEstus > state.current_estus) {
      // Advance regen timer by the number of charges restored
      const advancedRegen = new Date(
        lastRegen.getTime() + chargesToRestore * 24 * 60 * 60 * 1000
      );
      await updateFlameState(db, {
        current_estus: newEstus,
        last_estus_regen: advancedRegen.toISOString(),
      });
    }
  }, []);

  return { useCharge, checkRegen };
}
