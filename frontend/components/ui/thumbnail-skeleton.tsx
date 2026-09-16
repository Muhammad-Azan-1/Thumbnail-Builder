import { Loader2 } from "lucide-react";
import {useFauxProgress} from '@/hooks/use-faux-progress'
export function ThumbnailSkeleton({
  prompt = "Generating your design...",
  isloading,
  duration = 45000
}: {
  prompt: string;
  isloading : boolean;
  duration? : number ;


}) {

  const progress = useFauxProgress(isloading , duration)

  
  return (
    <div className="relative flex flex-col gap-3 w-full h-full">
      <div 
        className="relative aspect-[16/10] overflow-hidden rounded-[14px] bg-[#141415] border border-[#262628]"
        aria-label="Generating image"
        role="img"
      >
      <div className="absolute top-2 font-mono right-2 flex items-center gap-1 bg-black/70 text-white  font-medium px-2 py-1 rounded-full backdrop-blur-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          {Math.round(progress)}%
        </div>
        {/* Dim dotted background */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)',
            backgroundSize: '16px 16px'
          }}
        />

        {/* Bright morphing dotted mask */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at center, #ffffff 1.2px, transparent 1.2px)',
            backgroundSize: '16px 16px',
            // WebkitMaskImage: 'radial-gradient(circle, black 2%, transparent 40%), radial-gradient(circle, black 2%, transparent 40%)',
            WebkitMaskImage: 'radial-gradient(circle, black 2%, transparent 60%)',
            // maskImage: 'radial-gradient(circle, black 2%, transparent 40%), radial-gradient(circle, black 2%, transparent 40%)',
            maskImage: 'radial-gradient(circle, black 2%, transparent 60%)',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            // animation: 'ig-morph 8s infinite',
            animation: 'ig-morph 18s infinite ease-in-out',
          }}
        />

      </div>

      <div className="flex flex-col gap-1 px-1">
        <span className="text-sm font-mono font-semibold text-zinc-200">Generating thumbnail...</span>
        <span className=" text-zinc-500 italic truncate">“{prompt}”</span>
      </div>
    </div>
  );
}

export default ThumbnailSkeleton;

