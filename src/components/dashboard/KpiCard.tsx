import { motion } from "framer-motion";

export const KpiCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "indigo"
}: any) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`rounded-2xl p-6 bg-${color}-50 dark:bg-${color}-900/20 border border-${color}-100 dark:border-${color}-800`}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">
            {title}
          </p>
          <p className="text-3xl font-black mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-${color}-600 text-white`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};
