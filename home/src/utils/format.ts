export function toScaledValue(input: string, decimals: number): bigint {
  const sanitized = input.trim();
  if (!sanitized) {
    throw new Error("Enter a price before submitting.");
  }

  if (!/^[0-9]+(\.[0-9]+)?$/.test(sanitized)) {
    throw new Error("Use numeric values for prices.");
  }

  const [whole, fraction = ""] = sanitized.split(".");
  const paddedFraction = (fraction + "0".repeat(decimals)).slice(0, decimals);
  const normalizedWhole = whole.replace(/^0+/, "") || "0";

  return BigInt(normalizedWhole + paddedFraction);
}

export function formatScaledValue(value: bigint | undefined, decimals: number): string {
  if (value === undefined) return "—";

  const raw = value.toString().padStart(decimals + 1, "0");
  const whole = raw.slice(0, raw.length - decimals) || "0";
  const fraction = raw.slice(raw.length - decimals).replace(/0+$/, "");

  return fraction ? `${whole}.${fraction}` : whole;
}

export function formatTimestamp(seconds?: bigint | number): string {
  if (seconds === undefined || Number(seconds) === 0) return "Pending";
  const timestamp = typeof seconds === "bigint" ? Number(seconds) : seconds;
  return new Date(timestamp * 1000).toUTCString();
}

export function formatDayLabel(day?: bigint | number): string {
  if (day === undefined) return "—";
  return `Day ${day.toString()}`;
}

export function formatStake(value?: bigint): string {
  if (value === undefined) return "—";
  return `${(Number(value) / 1e18).toFixed(4)} ETH`;
}
