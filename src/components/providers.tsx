import type { ReactNode } from 'react'
import {
  Configuration,
  ModalManager,
  PopoverManager,
  Toaster,
  LiveLog,
} from "@pega/cosmos-react-core";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Configuration>
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

