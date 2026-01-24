declare module "react-adaptivecards" {
  import { ComponentType } from "react";

  interface AdaptiveCardProps {
    payload: Record<string, unknown>;
    onExecuteAction?: (action: Record<string, unknown>) => void;
    onParseError?: (error: Error) => void;
    style?: React.CSSProperties;
    hostConfig?: Record<string, unknown>;
  }

  const AdaptiveCard: ComponentType<AdaptiveCardProps>;
  export default AdaptiveCard;
}
