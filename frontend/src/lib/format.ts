
// "Há 2 dias", "Há 1 semana"...
export function timeAgo(iso: string): string {
  // o servidor guarda em UTC, sem o "Z" no final
  const date = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : iso + "Z");
  const sec = Math.max(0, (Date.now() - date.getTime()) / 1000);

  const min = Math.floor(sec / 60);
  if (min < 1) return "Agora mesmo";
  if (min < 60) return `Há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Há ${d} ${d === 1 ? "dia" : "dias"}`;
  const w = Math.floor(d / 7);
  if (d < 30) return `Há ${w} ${w === 1 ? "semana" : "semanas"}`;
  const m = Math.floor(d / 30);
  if (d < 365) return `Há ${m} ${m === 1 ? "mês" : "meses"}`;
  const y = Math.floor(d / 365);
  return `Há ${y} ${y === 1 ? "ano" : "anos"}`;
}

// "Marina Costa" -> "MC"
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
