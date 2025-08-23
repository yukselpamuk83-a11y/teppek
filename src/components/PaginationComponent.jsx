function PaginationComponent({ currentPage, totalPages, onPageChange }) {
    const getPageNumbers = () => {
        const pageNumbers = []
        const maxPagesToShow = 7
        const halfPages = Math.floor(maxPagesToShow / 2)

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i)
            }
        } else {
            pageNumbers.push(1)
            if (currentPage > halfPages + 1) {
                pageNumbers.push('...')
            }

            let start = Math.max(2, currentPage - halfPages + (currentPage > totalPages - halfPages ? totalPages - currentPage - halfPages + 1 : 0))
            let end = Math.min(totalPages - 1, currentPage + halfPages - (currentPage <= halfPages ? currentPage - halfPages : 0))
            
            for (let i = start; i <= end; i++) {
                pageNumbers.push(i)
            }

            if (currentPage < totalPages - halfPages) {
                pageNumbers.push('...')
            }
            pageNumbers.push(totalPages)
        }
        return pageNumbers
    }

    if (totalPages <= 1) return null

    return (
        <div className="flex justify-center items-center gap-2 mt-4">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">Önceki</button>
            
            {getPageNumbers().map((page, index) => 
                typeof page === 'number' ? (
                    <button 
                        key={index}
                        onClick={() => onPageChange(page)}
                        className={`w-8 h-8 rounded-md ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                        {page}
                    </button>
                ) : (
                    <span key={index} className="px-2 text-gray-500">...</span>
                )
            )}

            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">Sonraki</button>
        </div>
    )
}

export default PaginationComponent