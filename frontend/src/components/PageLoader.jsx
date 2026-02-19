import LoadingSpinner from './LoadingSpinner';

const PageLoader = ({ message = 'Loading...' }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <LoadingSpinner size="xl" />
                <p className="mt-4 text-gray-600 text-lg font-medium">{message}</p>
            </div>
        </div>
    );
};

export default PageLoader;
