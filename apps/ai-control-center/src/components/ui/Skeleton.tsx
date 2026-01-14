import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  lines = 1,
  animation = 'pulse',
}) => {
  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : '40px'),
    height: height || (variant === 'text' ? '1em' : '40px'),
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`skeleton-text-group ${className}`}>
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={`skeleton skeleton--text skeleton--${animation}`}
            style={{
              ...style,
              width: index === lines - 1 ? '60%' : '100%',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`skeleton skeleton--${variant} skeleton--${animation} ${className}`}
      style={style}
    />
  );
};

interface SkeletonCardProps {
  className?: string;
  showAvatar?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showActions?: boolean;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className = '',
  showAvatar = true,
  showTitle = true,
  showSubtitle = true,
  showActions = true,
  lines = 3,
}) => {
  return (
    <div className={`skeleton-card ${className}`}>
      <div className="skeleton-card__header">
        {showAvatar && <Skeleton variant="circular" width={40} height={40} />}
        <div className="skeleton-card__header-content">
          {showTitle && <Skeleton width="60%" height={20} />}
          {showSubtitle && <Skeleton width="40%" height={16} />}
        </div>
        {showActions && <Skeleton width={80} height={32} />}
      </div>
      <div className="skeleton-card__body">
        <Skeleton lines={lines} />
      </div>
    </div>
  );
};

interface SkeletonPanelProps {
  className?: string;
  showMetrics?: boolean;
  showAlerts?: boolean;
  metricCount?: number;
  alertCount?: number;
}

export const SkeletonPanel: React.FC<SkeletonPanelProps> = ({
  className = '',
  showMetrics = true,
  showAlerts = true,
  metricCount = 4,
  alertCount = 2,
}) => {
  return (
    <div className={`skeleton-panel ${className}`}>
      <div className="skeleton-panel__header">
        <div className="skeleton-panel__title">
          <Skeleton width="30%" height={16} />
          <Skeleton width="50%" height={24} />
        </div>
        <div className="skeleton-panel__meta">
          <Skeleton width={60} height={20} />
          <Skeleton width={80} height={32} />
        </div>
      </div>
      
      {showMetrics && (
        <div className="skeleton-panel__metrics">
          {Array.from({ length: metricCount }, (_, index) => (
            <div key={index} className="skeleton-panel__metric">
              <Skeleton width="100%" height={16} />
              <Skeleton width="60%" height={20} />
            </div>
          ))}
        </div>
      )}
      
      {showAlerts && (
        <div className="skeleton-panel__alerts">
          {Array.from({ length: alertCount }, (_, index) => (
            <div key={index} className="skeleton-panel__alert">
              <div className="skeleton-panel__alert-content">
                <Skeleton width="70%" height={16} />
                <Skeleton width="100%" height={14} />
              </div>
              <Skeleton width={60} height={14} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Skeleton;
