import { X, Layers, Waves, Satellite, Compass } from 'lucide-react';

interface LayerSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLayer: string;
  onSelectLayer: (layer: string) => void;
}

const LAYERS = [
  {
    id: 'openSeaMap',
    name: 'OpenSeaMap',
    description: 'Standard marine charts with depth contours',
    icon: Waves,
  },
  {
    id: 'navionics',
    name: 'Navionics Style',
    description: 'Clean chart style with navigation aids',
    icon: Compass,
  },
  {
    id: 'satellite',
    name: 'Satellite',
    description: 'Aerial imagery with navigation overlay',
    icon: Satellite,
  },
  {
    id: 'water',
    name: 'Water Depth',
    description: 'Focus on water depths and contours',
    icon: Waves,
  },
];

export function LayerSelector({
  isOpen,
  onClose,
  selectedLayer,
  onSelectLayer,
}: LayerSelectorProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="bg-white rounded-t-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Chart Selection
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3">
          {LAYERS.map((layer) => {
            const Icon = layer.icon;
            const isSelected = selectedLayer === layer.id;

            return (
              <button
                key={layer.id}
                onClick={() => {
                  onSelectLayer(layer.id);
                  onClose();
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {layer.name}
                </div>
                <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {layer.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
