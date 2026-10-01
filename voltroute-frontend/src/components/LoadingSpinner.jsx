import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="flex h-full w-full items-center justify-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  );
};

export default LoadingSpinner;
