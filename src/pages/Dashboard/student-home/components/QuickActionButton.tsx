import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface QuickActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
}

const QuickActionButton = ({ children, onClick }: QuickActionButtonProps) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full rounded-xl bg-blue-main px-6 py-3 font-medium text-white transition-colors hover:bg-blue-600"
  >
    {children}
  </motion.button>
);

export default QuickActionButton;
