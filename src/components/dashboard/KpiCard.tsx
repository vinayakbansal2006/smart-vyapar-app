import { motion } from "framer-motion";

const palette: Record<string, { soft: string; strong: string }> = {
  indigo: { soft: "rgba(124,58,237,0.12)", strong: "var(--brand)" },
  green: { soft: "rgba(22,163,74,0.12)", strong: "var(--color-success)" },
  red: { soft: "rgba(220,38,38,0.12)", strong: "var(--color-danger)" },
  blue: { soft: "rgba(37,99,235,0.12)", strong: "var(--color-info)" },
};

export const KpiCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "indigo"
}: any) => {
  const tone = palette[color] || palette.indigo;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl p-5 border"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow)",
      }}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs uppercase tracking-wide font-black" style={{ color: "var(--color-text-secondary)" }}>
            {title}
          </p>
          <p className="text-3xl font-black mt-1" style={{ color: "var(--color-text-primary)" }}>{value}</p>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>{subtitle}</p>
          )}
        </div>
        <div className="p-3 rounded-xl" style={{ background: tone.soft, color: tone.strong }}>
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
      </div>
    </motion.div>
  );
};
