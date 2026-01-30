import { Dataset } from '@/data/datasets'

interface DatasetCardProps {
  dataset: Dataset
}

export default function DatasetCard({ dataset }: DatasetCardProps) {
  return (
    <a
      href={dataset.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-100"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-bold text-gray-900">{dataset.name}</h3>
        {dataset.apiAvailable && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            API
          </span>
        )}
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {dataset.description}
      </p>

      <div className="flex flex-wrap gap-1 mb-4">
        {dataset.dataTypes.slice(0, 3).map((type) => (
          <span
            key={type}
            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded"
          >
            {type}
          </span>
        ))}
        {dataset.dataTypes.length > 3 && (
          <span className="text-xs text-gray-400">
            +{dataset.dataTypes.length - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">{dataset.category}</span>
        {dataset.size && (
          <span className="text-gray-400">{dataset.size}</span>
        )}
      </div>
    </a>
  )
}
