function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center items-center space-x-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-5 py-3 text-xl rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 shadow-sm transition-all"
      >
        ‹
      </button>

      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-5 py-3 text-xl rounded-lg font-bold transition-all shadow-sm ${currentPage === page
              ? 'bg-primary text-white scale-110 shadow-primary/20'
              : 'bg-white border border-gray-300 hover:bg-gray-50'
            }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-5 py-3 text-xl rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 shadow-sm transition-all"
      >
        ›
      </button>
    </div>
  );
}

export default Pagination;
