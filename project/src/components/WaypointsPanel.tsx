import { useState } from 'react';
import {
  X,
  MapPin,
  Navigation2,
  Trash2,
  Edit3,
} from 'lucide-react';
import { Waypoint } from '../types';

interface WaypointsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  waypoints: Waypoint[];
  onEdit: (waypoint: Waypoint) => void;
  onDelete: (id: string) => void;
  onNavigate: (waypoint: Waypoint) => void;
}

const WAYPOINT_SYMBOLS: Record<string, string> = {
  waypoint: '📍',
  anchor: '⚓',
  marina: '⛵',
  hazard: '⚠️',
  fishing: '🎣',
  dive: '🤿',
  beach: '🏖️',
  custom: '📌',
};

export function WaypointsPanel({
  isOpen,
  onClose,
  waypoints,
  onEdit,
  onDelete,
  onNavigate,
}: WaypointsPanelProps) {
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');

  const filteredWaypoints = waypoints
    .filter((w) =>
      w.name.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="bg-white rounded-t-2xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Waypoints ({waypoints.length})
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search waypoints..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'date')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Recent</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredWaypoints.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {filter ? 'No matching waypoints' : 'No waypoints saved yet'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredWaypoints.map((waypoint) => (
                <li
                  key={waypoint.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                      style={{
                        backgroundColor: `${waypoint.color}20`,
                        border: `2px solid ${waypoint.color}`,
                      }}
                    >
                      {WAYPOINT_SYMBOLS[waypoint.symbol] || WAYPOINT_SYMBOLS.waypoint}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {waypoint.name}
                      </div>
                      {waypoint.description && (
                        <div className="text-sm text-gray-500 truncate">
                          {waypoint.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1 font-mono">
                        {waypoint.latitude.toFixed(5)},{' '}
                        {waypoint.longitude.toFixed(5)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onNavigate(waypoint)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Navigate to waypoint"
                      >
                        <Navigation2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(waypoint)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit waypoint"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(waypoint.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete waypoint"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
