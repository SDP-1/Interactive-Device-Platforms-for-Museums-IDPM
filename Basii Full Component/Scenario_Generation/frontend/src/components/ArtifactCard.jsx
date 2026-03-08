import { Link } from 'react-router-dom';

function ArtifactCard({ artifact }) {
  return (
    <div className="card hover:scale-105">
      <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-2xl p-4">
        <img
          src={artifact.images[0]}
          alt={artifact.name}
          className="w-full h-64 object-contain bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-500 p-4"
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/600x400/8B7355/ffffff?text=${encodeURIComponent(artifact.name.substring(0, 20))}`;
          }}
        />
      </div>
      <div className="p-8">
        <h3 className="text-2xl font-serif font-bold text-gray-800 mb-4 line-clamp-2 min-h-[4.5rem] leading-tight group-hover:text-primary transition-colors">
          {artifact.name}
        </h3>
        <div className="space-y-2 mb-6">
          <p className="text-lg text-primary font-bold tracking-wide uppercase italic">{artifact.category}</p>
          <p className="text-base text-gray-600 font-medium">{artifact.era} • {artifact.period}</p>
        </div>
        <Link
          to={`/artifact/${artifact.id}`}
          className="block w-full text-center bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white py-4 rounded-xl transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-orange-500/30 uppercase tracking-widest"
        >
          Explore Scenarios
        </Link>
      </div>
    </div>
  );
}

export default ArtifactCard;
