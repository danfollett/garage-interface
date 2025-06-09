import React from 'react';
import { 
  Droplet, 
  RefreshCw, 
  Disc, 
  Wind, 
  Battery, 
  Search, 
  Droplets, 
  Wrench, 
  Link, 
  Zap,
  Tag
} from 'lucide-react';

const TagBadge = ({ tag, size = 'sm' }) => {
  // Map icon names to Lucide components
  const iconMap = {
    'droplet': Droplet,
    'refresh-cw': RefreshCw,
    'disc': Disc,
    'wind': Wind,
    'battery': Battery,
    'search': Search,
    'droplets': Droplets,
    'wrench': Wrench,
    'link': Link,
    'zap': Zap
  };

  const Icon = iconMap[tag.icon] || Tag;
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  return (
    <span
      className={`inline-flex items-center space-x-1 rounded-full ${sizeClasses[size]}`}
      style={{ 
        backgroundColor: tag.color + '30', 
        color: tag.color 
      }}
    >
      <Icon size={iconSizes[size]} />
      <span>{tag.name}</span>
    </span>
  );
};

export default TagBadge;