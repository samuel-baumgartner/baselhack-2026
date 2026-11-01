import { createRoot } from "react-dom/client";
import HostedHotel, { type HostedHotelProps } from "./hosted-hotel";
declare global { interface Window { __PRISM_HOTEL__: HostedHotelProps } }
createRoot(document.getElementById("root")!).render(<HostedHotel {...window.__PRISM_HOTEL__} embedded />);
