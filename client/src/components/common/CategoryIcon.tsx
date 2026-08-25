import React from 'react';
import {
  Construction,
  Lightbulb,
  Trash2,
  Footprints,
  Droplets,
  Trees,
  AlertTriangle,
  HelpCircle,
  LucideProps,
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  slug?: string;
  name?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  slug,
  name,
  ...props
}) => {
  const identifier = (slug || name || '').toLowerCase();

  if (identifier.includes('road') || identifier.includes('pothole')) {
    return <Construction {...props} />;
  }
  if (identifier.includes('light') || identifier.includes('lamp')) {
    return <Lightbulb {...props} />;
  }
  if (identifier.includes('waste') || identifier.includes('trash') || identifier.includes('sanitation')) {
    return <Trash2 {...props} />;
  }
  if (identifier.includes('sidewalk') || identifier.includes('foot') || identifier.includes('walkway')) {
    return <Footprints {...props} />;
  }
  if (identifier.includes('water') || identifier.includes('drain') || identifier.includes('pipe')) {
    return <Droplets {...props} />;
  }
  if (identifier.includes('park') || identifier.includes('tree') || identifier.includes('green')) {
    return <Trees {...props} />;
  }

  return <AlertTriangle {...props} />;
};
