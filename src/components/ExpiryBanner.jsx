import { AlertTriangle } from "lucide-react";

function fmt(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ExpiryBanner({ status }) {
  if (!status || !status.warn) return null;
  const days = status.daysLeft;
  return (
    <div className="expiry-banner">
      <AlertTriangle size={17} />
      <span>
        Your subscription expires in <b>{days} day{days === 1 ? "" : "s"}</b> (on {fmt(status.endDate)}).
        Please renew to avoid interruption.
      </span>
    </div>
  );
}
