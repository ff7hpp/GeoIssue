import { useTranslation } from "react-i18next";
import {
  Clock,
  Eye,
  CheckCircle2,
  Hammer,
  CheckCheck,
  XCircle
} from "lucide-react";
const StatusBadge = ({
  status,
  showIcon = true
}) => {
  const { t } = useTranslation();
  const getIcon = () => {
    switch (status) {
      case "submitted":
        return <Clock size={12} />;
      case "in_review":
        return <Eye size={12} />;
      case "accepted":
        return <CheckCircle2 size={12} />;
      case "in_progress":
        return <Hammer size={12} />;
      case "resolved":
        return <CheckCheck size={12} />;
      case "rejected":
        return <XCircle size={12} />;
    }
  };
  return <span className={`badge badge-${status}`}>
      {showIcon && getIcon()}
      <span>{t(`status.${status}`)}</span>
    </span>;
};
export {
  StatusBadge
};
