import type { HankoAuthElementProps } from "@teamhanko/hanko-elements";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "hanko-auth": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<HankoAuthElementProps>;
      "hanko-profile": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "hanko-events": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
