import type { ReactNode } from 'react'
import {
  Configuration,
  ModalManager,
  PopoverManager,
  Toaster,
  LiveLog,
  Bootes2025Theme
} from "@pega/cosmos-react-core";
import { registerCosmosIcons } from "@/lib/cosmos-icons";

// Register cosmos icons once
registerCosmosIcons();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Configuration theme={Bootes2025Theme}>
      <LiveLog maxLength={50}>
        <PopoverManager>
          <Toaster dismissAfter={5000}>
            <ModalManager>
              {children as any}
            </ModalManager>
          </Toaster>
        </PopoverManager>
      </LiveLog>
    </Configuration>
  );
}

