const displayNumberFormatter = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 2
});

export function formatDisplayNumber(value, maxDecimals = 2){
  const number = Number(value);
  if(!Number.isFinite(number)) return value ?? "—";
  if(maxDecimals === 2) return displayNumberFormatter.format(number);
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: Math.max(0, maxDecimals)
  }).format(number);
}

export function formatDisplayReport(value){
  if(typeof value === "number") return formatDisplayNumber(value);
  if(Array.isArray(value)) return value.map(formatDisplayReport);
  if(value && typeof value === "object"){
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, formatDisplayReport(item)]));
  }
  return value;
}
