import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StubPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

const StubPage = ({ title, description, icon: Icon }: StubPageProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col items-center justify-center h-full p-6"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-xl font-bold font-display text-foreground mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground text-center max-w-md">{description}</p>
      <div className="mt-6 px-4 py-2 rounded-lg bg-muted text-sm text-muted-foreground">
        Em desenvolvimento — Em breve disponível
      </div>
    </motion.div>
  );
};

export default StubPage;
