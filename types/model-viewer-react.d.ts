// React 19 reads JSX elements from React.JSX (not the global JSX that
// model-viewer.d.ts declares), so <model-viewer> is declared here as well.
import "react";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        poster?: string;
        alt?: string;
        loading?: string;
        reveal?: string;
        "auto-rotate"?: boolean;
        "camera-controls"?: boolean;
        "interaction-prompt"?: string;
        "shadow-intensity"?: string;
        exposure?: string;
        "camera-orbit"?: string;
      };
    }
  }
}
