import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Issue } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { Users, FileText, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface LeafletMapProps {
  issues: Issue[];
  selectedIssue?: Issue | null;
  onSelectIssue?: (issue: Issue) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
}

// Helper component to smoothly center map when selected issue changes
function MapRecenter({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom || map.getZoom(), { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  issues,
  selectedIssue,
  onSelectIssue,
  center = [39.9255, 32.8662], // Ankara default
  zoom = 13,
  height = '100%',
}) => {
  const { t } = useTranslation();

  const createIssueIcon = (issue: Issue, isSelected: boolean) => {
    const statusClass = `marker-${issue.status}`;
    const selectedClass = isSelected ? 'selected-marker' : '';

    return L.divIcon({
      className: 'custom-leaflet-marker-wrapper',
      html: `
        <div class="custom-issue-marker ${statusClass} ${selectedClass}" style="${
        isSelected ? 'transform: scale(1.3); border-width: 3px; z-index: 999;' : ''
      }">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -20],
    });
  };

  const activeCenter: [number, number] = selectedIssue
    ? [Number(selectedIssue.latitude), Number(selectedIssue.longitude)]
    : center;

  return (
    <div style={{ width: '100%', height, position: 'relative', overflow: 'hidden' }}>
      <MapContainer
        center={activeCenter}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {selectedIssue && (
          <MapRecenter
            center={[Number(selectedIssue.latitude), Number(selectedIssue.longitude)]}
            zoom={15}
          />
        )}

        {issues.map((issue) => {
          const isSelected = selectedIssue?.id === issue.id;
          const pos: [number, number] = [
            Number(issue.latitude),
            Number(issue.longitude),
          ];

          return (
            <Marker
              key={issue.id}
              position={pos}
              icon={createIssueIcon(issue, isSelected)}
              eventHandlers={{
                click: () => onSelectIssue && onSelectIssue(issue),
              }}
            >
              <Popup>
                <div style={{ padding: '14px', minWidth: '240px', maxWidth: '300px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      gap: '8px',
                    }}
                  >
                    <StatusBadge status={issue.status} />
                    <PriorityBadge priority={issue.priority} />
                  </div>

                  <h4
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      marginBottom: '6px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {issue.title}
                  </h4>

                  {issue.summary && (
                    <p
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '10px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {issue.summary}
                    </p>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: 'var(--text-tertiary)',
                      borderTop: '1px solid var(--border-default)',
                      paddingTop: '8px',
                      marginTop: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FileText size={12} /> {issue.report_count}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={12} /> {issue.supporter_count || 0}
                      </span>
                    </div>

                    <Link
                      to={`/issues/${issue.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--accent-primary)',
                        fontWeight: 600,
                      }}
                    >
                      <span>{t('issue.details')}</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
